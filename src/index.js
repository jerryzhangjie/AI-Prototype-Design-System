import 'dotenv/config';
import http from 'http';
import Router from './lib/router.js';
import * as middleware from './lib/middleware.js';
import OpenCodeManager from './lib/opencode-manager.js';
import TempManager from './lib/temp-manager.js';
import VueProjectGenerator from './lib/vue-project-generator.js';
import PromptEngineer from './lib/prompt-engineer.js';
import archiver from 'archiver';
import fs from 'fs/promises';
import path from 'path';

class AIDesignSystem {
  constructor() {
    this.port = process.env.PORT || 3000;
    this.openCodeManager = null;
    this.tempManager = null;
    this.projectGenerator = null;
    this.router = new Router();
    this.server = null;
    this.isShuttingDown = false;
  }

  async initialize() {
    console.log('Initializing AI Design System...');

    this.openCodeManager = new OpenCodeManager({
      port: process.env.OPENCODE_SERVER_PORT || 4096
    });

    this.tempManager = new TempManager({
      maxAge: parseInt(process.env.TEMP_MAX_AGE) || 24 * 60 * 60 * 1000,
      cleanupInterval: parseInt(process.env.TEMP_CLEANUP_INTERVAL) || 60 * 60 * 1000
    });

    this.projectGenerator = new VueProjectGenerator({
      serverUrl: `http://127.0.0.1:${process.env.OPENCODE_SERVER_PORT || 4096}`
    });

    await this.setupRoutes();
    await this.setupMiddleware();

    console.log('AI Design System initialized');
  }

  async setupMiddleware() {
    this.router.use(middleware.requestId());
    this.router.use(middleware.logger);
    this.router.use(middleware.cors);
    this.router.use(middleware.validateContentType());
    this.router.use(middleware.rateLimiter(
      parseInt(process.env.RATE_LIMIT_MAX) || 100,
      parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000
    ));
    this.router.use(middleware.jsonParser);
    this.router.use(middleware.errorHandler);
  }

  async setupRoutes() {
    this.router.get('/api/health', this.handleHealthCheck.bind(this));
    this.router.get('/api/status', this.handleStatusCheck.bind(this));
    this.router.post('/api/generate', this.handleGenerate.bind(this));
    this.router.get('/api/download/:projectId', this.handleDownload.bind(this));
    this.router.get('/api/project/:projectId', this.handleProjectInfo.bind(this));
    this.router.delete('/api/project/:projectId', this.handleDeleteProject.bind(this));
  }

  async handleHealthCheck(req, res) {
    try {
      const opencodeHealth = this.openCodeManager.isReady() 
        ? await this.openCodeManager.healthCheck()
        : { healthy: false };

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          opencode: opencodeHealth.healthy ? 'healthy' : 'unhealthy',
          tempManager: 'healthy'
        },
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        error: error.message
      });
    }
  }

  async handleStatusCheck(req, res) {
    try {
      const stats = this.tempManager.getStats();
      
      res.json({
        status: 'ok',
        opencode: {
          ready: this.openCodeManager.isReady(),
          serverUrl: this.openCodeManager.getServerUrl()
        },
        tempManager: {
          totalProjects: stats.totalProjects,
          baseDir: stats.baseDir
        },
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          nodeVersion: process.version
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error.message
      });
    }
  }

  async handleGenerate(req, res) {
    if (this.isShuttingDown) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'System is shutting down'
      });
    }

    const { design, options = {} } = req.body;

    if (!design || !design.description) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Design description is required'
      });
    }

    if (!this.openCodeManager.isReady()) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'OpenCode server is not ready'
      });
    }

    console.log(`Received generation request: ${design.description.substring(0, 100)}...`);

    try {
      const prompt = PromptEngineer.designToPrompt({
        name: design.name || 'Generated Vue2 Project',
        description: design.description,
        requirements: design.requirements || '',
        style: design.style || '科技风，简约易用',
        components: design.components || [],
        pages: design.pages || [],
        features: design.features || []
      });

      const result = await this.projectGenerator.generateProject({
        name: design.name || 'Generated Vue2 Project',
        description: design.description,
        requirements: design.requirements || '',
        style: design.style || '科技风，简约易用',
        components: design.components || [],
        pages: design.pages || [],
        features: design.features || []
      }, options);

      if (!result.success) {
        return res.status(500).json({
          error: 'Generation Failed',
          message: result.error
        });
      }

      res.json({
        success: true,
        projectId: result.projectId,
        projectDir: result.projectDir,
        files: result.files,
        totalSize: result.totalSize,
        explanation: result.explanation,
        downloadUrl: `/api/download/${result.projectId}`,
        infoUrl: `/api/project/${result.projectId}`,
        createdAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Generation error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  async handleDownload(req, res) {
    const { projectId } = req.params;

    try {
      const projectInfo = await this.tempManager.getProjectInfo(projectId);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="vue-project-${projectId}.zip"`);

      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      archive.on('error', (err) => {
        console.error('Archive error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Archive Error',
            message: err.message
          });
        }
      });

      archive.pipe(res);

      archive.directory(projectInfo.dirPath, false);

      await archive.finalize();

      console.log(`Download sent for project ${projectId}`);

    } catch (error) {
      console.error('Download error:', error);
      res.status(404).json({
        error: 'Not Found',
        message: `Project ${projectId} not found or expired`
      });
    }
  }

  async handleProjectInfo(req, res) {
    const { projectId } = req.params;

    try {
      const projectInfo = await this.tempManager.getProjectInfo(projectId);
      res.json(projectInfo);
    } catch (error) {
      res.status(404).json({
        error: 'Not Found',
        message: `Project ${projectId} not found or expired`
      });
    }
  }

  async handleDeleteProject(req, res) {
    const { projectId } = req.params;

    try {
      const success = await this.tempManager.deleteProject(projectId);
      
      if (success) {
        res.json({
          success: true,
          message: `Project ${projectId} deleted`
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  async start() {
    try {
      await this.initialize();
      
      console.log('Starting OpenCode server...');
      await this.openCodeManager.start();
      
      this.server = http.createServer((req, res) => {
        this.router.handleRequest(req, res);
      });

      this.server.listen(this.port, () => {
        console.log(`AI Design System server running on port ${this.port}`);
        console.log(`OpenCode server running on ${this.openCodeManager.getServerUrl()}`);
        console.log(`Health check: http://localhost:${this.port}/api/health`);
        console.log('Ready to accept generation requests...');
      });

      this.setupGracefulShutdown();

    } catch (error) {
      console.error('Failed to start AI Design System:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async () => {
      if (this.isShuttingDown) return;
      
      this.isShuttingDown = true;
      console.log('\nShutting down AI Design System...');

      try {
        if (this.server) {
          await new Promise((resolve) => {
            this.server.close(() => {
              console.log('HTTP server closed');
              resolve();
            });
          });
        }

        if (this.openCodeManager) {
          await this.openCodeManager.stop();
        }

        if (this.tempManager) {
          await this.tempManager.shutdown();
        }

        console.log('AI Design System shutdown complete');
        process.exit(0);

      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('SIGUSR2', shutdown);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new AIDesignSystem();
  app.start().catch(console.error);
}

export default AIDesignSystem;