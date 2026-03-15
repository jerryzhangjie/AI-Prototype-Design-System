import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

class TempManager {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(os.tmpdir(), 'ai-prototype-projects');
    this.maxAge = options.maxAge || 24 * 60 * 60 * 1000;
    this.cleanupInterval = options.cleanupInterval || 60 * 60 * 1000;
    this.activeProjects = new Map();
    this.cleanupTimer = null;
    
    this.ensureBaseDir();
    this.startCleanup();
  }

  async ensureBaseDir() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      console.log(`Temp directory initialized: ${this.baseDir}`);
    } catch (error) {
      console.error('Failed to create temp directory:', error);
      throw error;
    }
  }

  async createProjectDir(prefix = 'vue-project') {
    const projectId = uuidv4();
    const dirName = `${prefix}-${projectId}`;
    const dirPath = path.join(this.baseDir, dirName);
    
    try {
      await fs.mkdir(dirPath, { recursive: true });
      
      const metadata = {
        id: projectId,
        path: dirPath,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        prefix,
        files: []
      };
      
      this.activeProjects.set(projectId, metadata);
      console.log(`Created project directory: ${dirPath}`);
      
      return {
        projectId,
        dirPath,
        metadata
      };
    } catch (error) {
      console.error('Failed to create project directory:', error);
      throw error;
    }
  }

  async createFile(projectId, filePath, content) {
    const metadata = this.activeProjects.get(projectId);
    if (!metadata) {
      throw new Error(`Project ${projectId} not found`);
    }
    
    const fullPath = path.join(metadata.path, filePath);
    const dir = path.dirname(fullPath);
    
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content, 'utf8');
      
      metadata.lastAccessed = Date.now();
      
      const stats = await fs.stat(fullPath);
      metadata.files.push({
        path: filePath,
        size: stats.size,
        created: Date.now()
      });
      
      console.log(`Created file: ${filePath} (${stats.size} bytes)`);
      
      return {
        filePath,
        fullPath,
        size: stats.size
      };
    } catch (error) {
      console.error(`Failed to create file ${filePath}:`, error);
      throw error;
    }
  }

  async getProjectInfo(projectId) {
    const metadata = this.activeProjects.get(projectId);
    if (!metadata) {
      throw new Error(`Project ${projectId} not found`);
    }
    
    metadata.lastAccessed = Date.now();
    
    try {
      const files = [];
      let totalSize = 0;
      
      async function scanDir(dir, basePath = '') {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.join(basePath, entry.name);
          
          if (entry.isDirectory()) {
            await scanDir(fullPath, relativePath);
          } else {
            const stats = await fs.stat(fullPath);
            files.push({
              path: relativePath,
              size: stats.size,
              modified: stats.mtime
            });
            totalSize += stats.size;
          }
        }
      }
      
      await scanDir(metadata.path);
      
      return {
        projectId,
        dirPath: metadata.path,
        createdAt: metadata.createdAt,
        age: Date.now() - metadata.createdAt,
        fileCount: files.length,
        totalSize,
        files: files.sort((a, b) => a.path.localeCompare(b.path))
      };
    } catch (error) {
      console.error(`Failed to scan project ${projectId}:`, error);
      throw error;
    }
  }

  async cleanupExpired() {
    const now = Date.now();
    const expiredProjects = [];
    
    for (const [projectId, metadata] of this.activeProjects.entries()) {
      if (now - metadata.createdAt > this.maxAge) {
        expiredProjects.push(projectId);
      }
    }
    
    for (const projectId of expiredProjects) {
      await this.deleteProject(projectId);
    }
    
    if (expiredProjects.length > 0) {
      console.log(`Cleaned up ${expiredProjects.length} expired projects`);
    }
    
    return expiredProjects.length;
  }

  async deleteProject(projectId) {
    const metadata = this.activeProjects.get(projectId);
    if (!metadata) {
      return false;
    }
    
    try {
      await fs.rm(metadata.path, { recursive: true, force: true });
      this.activeProjects.delete(projectId);
      console.log(`Deleted project directory: ${metadata.path}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete project ${projectId}:`, error);
      return false;
    }
  }

  async cleanupAll() {
    console.log('Cleaning up all temp directories...');
    
    const projectIds = Array.from(this.activeProjects.keys());
    let successCount = 0;
    
    for (const projectId of projectIds) {
      if (await this.deleteProject(projectId)) {
        successCount++;
      }
    }
    
    try {
      await fs.rm(this.baseDir, { recursive: true, force: true });
      console.log('Cleaned up base directory');
    } catch (error) {
      console.error('Failed to cleanup base directory:', error);
    }
    
    return {
      total: projectIds.length,
      success: successCount
    };
  }

  startCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired().catch(console.error);
    }, this.cleanupInterval);
    
    console.log(`Started cleanup scheduler (interval: ${this.cleanupInterval}ms)`);
    
    process.on('exit', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    console.log('Temp manager shutting down...');
    
    const result = await this.cleanupAll();
    console.log(`Temp manager shutdown complete. Cleaned up ${result.success}/${result.total} projects.`);
  }

  getStats() {
    const now = Date.now();
    const projects = Array.from(this.activeProjects.values()).map(m => ({
      id: m.id,
      path: m.path,
      age: now - m.createdAt,
      lastAccessed: now - m.lastAccessed,
      fileCount: m.files.length,
      prefix: m.prefix
    }));
    
    return {
      baseDir: this.baseDir,
      maxAge: this.maxAge,
      cleanupInterval: this.cleanupInterval,
      totalProjects: projects.length,
      projects
    };
  }
}

export default TempManager;