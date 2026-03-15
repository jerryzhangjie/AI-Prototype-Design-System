import { defaultLogger } from './logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.resource = resource;
    this.id = id;
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service, message = 'Service temporarily unavailable') {
    super(`${service}: ${message}`, 503, 'SERVICE_UNAVAILABLE');
    this.service = service;
  }
}

export class OpenCodeError extends AppError {
  constructor(message, originalError = null) {
    super(`OpenCode Error: ${message}`, 500, 'OPENCODE_ERROR');
    this.originalError = originalError;
  }
}

export class ProjectGenerationError extends AppError {
  constructor(projectId, message) {
    super(`Project Generation Error: ${message}`, 500, 'PROJECT_GENERATION_ERROR');
    this.projectId = projectId;
  }
}

export function errorHandler(error, req, res) {
  const errorResponse = {
    error: error.code || 'INTERNAL_ERROR',
    message: error.message,
    timestamp: error.timestamp || new Date().toISOString()
  };

  if (error instanceof ValidationError && error.errors) {
    errorResponse.errors = error.errors;
  }

  if (error instanceof AppError) {
    if (error.isOperational) {
      defaultLogger.warn(error.message, {
        requestId: req.requestId,
        code: error.code,
        statusCode: error.statusCode
      });
    } else {
      defaultLogger.error(error.message, {
        requestId: req.requestId,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      });
    }
  } else {
    defaultLogger.error('Unhandled error', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });
    
    if (process.env.NODE_ENV === 'production') {
      errorResponse.message = 'An unexpected error occurred';
    } else {
      errorResponse.stack = error.stack;
    }
  }

  const statusCode = error.statusCode || 500;
  
  if (!res.headersSent) {
    res.status(statusCode).json(errorResponse);
  }
}

export function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      errorHandler(error, req, res);
    }
  };
}

export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, '')
        }));
        
        throw new ValidationError('Validation failed', errors);
      }

      req.body = value;
      next();
    } catch (error) {
      errorHandler(error, req, res);
    }
  };
}