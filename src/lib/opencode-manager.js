import { spawn } from 'child_process';
import http from 'http';

class OpenCodeManager {
  constructor(options = {}) {
    this.port = options.port || 4096;
    this.hostname = options.hostname || '127.0.0.1';
    this.process = null;
    this.serverUrl = `http://${this.hostname}:${this.port}`;
    this.maxRetries = options.maxRetries || 3;
    this.retryCount = 0;
    this.retryDelay = options.retryDelay || 5000;
    this.ready = false;
  }

  async start() {
    if (this.process) {
      throw new Error('OpenCode server is already running');
    }

    console.log(`Starting OpenCode server on ${this.serverUrl}`);

    return new Promise((resolve, reject) => {
      this.process = spawn('opencode', ['serve', '--port', this.port.toString()], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[OpenCode stdout] ${output.trim()}`);
      });

      this.process.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[OpenCode stderr] ${error.trim()}`);
      });

      this.process.on('close', (code) => {
        console.log(`OpenCode server process exited with code ${code}`);
        this.process = null;
        this.ready = false;
        
        if (code !== 0 && this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retrying OpenCode server (attempt ${this.retryCount}/${this.maxRetries}) in ${this.retryDelay}ms`);
          setTimeout(() => this.start().catch(console.error), this.retryDelay);
        }
      });

      this.process.on('error', (err) => {
        console.error('Failed to start OpenCode server:', err);
        reject(err);
      });

      this.waitForServerReady()
        .then(() => {
          console.log('OpenCode server is ready');
          this.ready = true;
          this.retryCount = 0;
          resolve();
        })
        .catch(reject);

      setTimeout(() => {
        if (!this.ready) {
          reject(new Error('OpenCode server startup timeout'));
        }
      }, 30000);
    });
  }

  async waitForServerReady() {
    const maxAttempts = 30;
    const interval = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.healthCheck();
        return;
      } catch (err) {
        if (i === maxAttempts - 1) {
          throw new Error('OpenCode server failed to become ready');
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  async healthCheck() {
    return new Promise((resolve, reject) => {
      const req = http.request(`${this.serverUrl}/global/health`, (res) => {
        if (res.statusCode === 200) {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.healthy) {
                resolve(result);
              } else {
                reject(new Error('OpenCode server is not healthy'));
              }
            } catch (err) {
              reject(err);
            }
          });
        } else {
          reject(new Error(`Health check failed with status ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
      req.end();
    });
  }

  async stop() {
    if (!this.process) {
      return;
    }

    console.log('Stopping OpenCode server...');
    
    return new Promise((resolve) => {
      this.process.once('close', () => {
        console.log('OpenCode server stopped');
        this.process = null;
        this.ready = false;
        resolve();
      });

      this.process.kill('SIGTERM');

      setTimeout(() => {
        if (this.process) {
          console.log('Force killing OpenCode server');
          this.process.kill('SIGKILL');
        }
      }, 10000);
    });
  }

  isReady() {
    return this.ready;
  }

  getServerUrl() {
    return this.serverUrl;
  }
}

export default OpenCodeManager;