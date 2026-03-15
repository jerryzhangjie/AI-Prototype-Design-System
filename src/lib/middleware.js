import { StringDecoder } from 'string_decoder';
import crypto from 'crypto';

function logger(req, res) {
  const startTime = Date.now();
  
  const originalRes = res.originalRes || res;
  
  if (typeof originalRes.on === 'function') {
    originalRes.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`${new Date().toISOString()} ${req.method} ${req.pathname} ${res.statusCode} ${duration}ms`);
    });
  }
  
  return true;
}

function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return false;
  }
  
  return true;
}

function jsonParser(req, res) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      return new Promise((resolve) => {
        const decoder = new StringDecoder('utf-8');
        let buffer = '';
        
        const originalReq = req.originalReq || req;
        
        originalReq.on('data', (data) => {
          buffer += decoder.write(data);
        });
        
        originalReq.on('end', () => {
          buffer += decoder.end();
          
          try {
            if (buffer.trim()) {
              req.body = JSON.parse(buffer);
            } else {
              req.body = {};
            }
          } catch (error) {
            res.status(400).json({
              error: 'Invalid JSON',
              message: error.message
            });
            return resolve(false);
          }
          
          resolve(true);
        });
        
        originalReq.on('error', (error) => {
          console.error('Request error:', error);
          res.status(500).json({
            error: 'Request Error',
            message: error.message
          });
          resolve(false);
        });
      });
    }
  }
  
  return true;
}

function errorHandler(req, res) {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  return true;
}

function rateLimiter(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const requests = new Map();
  
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(time => now - time < windowMs);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }
  }, 60000);
  
  return (req, res) => {
    const ip = req.headers['x-forwarded-for'] || (req.originalReq && req.originalReq.connection.remoteAddress) || 'unknown';
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const timestamps = requests.get(ip);
    const validTimestamps = timestamps.filter(time => now - time < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 60000} minutes`
      });
      return false;
    }
    
    validTimestamps.push(now);
    requests.set(ip, validTimestamps);
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - validTimestamps.length);
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
    
    return true;
  };
}

function requestId() {
  return (req, res) => {
      const requestId = crypto.randomBytes(8).toString('hex');
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    return true;
  };
}

function validateContentType(allowedTypes = ['application/json']) {
  return (req, res) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.headers['content-type'];
      
      if (!contentType) {
        res.status(400).json({
          error: 'Missing Content-Type',
          message: 'Content-Type header is required'
        });
        return false;
      }
      
      const isValid = allowedTypes.some(type => contentType.includes(type));
      
      if (!isValid) {
        res.status(415).json({
          error: 'Unsupported Media Type',
          message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
        });
        return false;
      }
    }
    
    return true;
  };
}

export {
  logger,
  cors,
  jsonParser,
  errorHandler,
  rateLimiter,
  requestId,
  validateContentType
};