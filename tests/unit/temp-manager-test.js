import { test, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs/promises';
import TempManager from '../../src/lib/temp-manager.js';

test.describe('TempManager', () => {
  let tempManager;
  const testBaseDir = path.join(process.cwd(), 'temp', 'test-projects');

  before(async () => {
    tempManager = new TempManager({
      baseDir: testBaseDir,
      maxAge: 60000,
      cleanupInterval: 300000
    });
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  after(async () => {
    if (tempManager) {
      await tempManager.cleanupAll();
    }
  });

  test('should create instance with default options', () => {
    const manager = new TempManager();
    assert.ok(manager.baseDir, 'should have baseDir');
    assert.ok(manager.maxAge, 'should have maxAge');
    assert.ok(manager.cleanupInterval, 'should have cleanupInterval');
    assert.ok(manager.activeProjects, 'should have activeProjects Map');
  });

  test('should create instance with custom options', () => {
    const manager = new TempManager({
      baseDir: '/custom/temp',
      maxAge: 3600000,
      cleanupInterval: 600000
    });
    assert.strictEqual(manager.baseDir, '/custom/temp');
    assert.strictEqual(manager.maxAge, 3600000);
    assert.strictEqual(manager.cleanupInterval, 600000);
  });

  test('should create project directory', async () => {
    const result = await tempManager.createProjectDir('test-project');
    
    assert.ok(result.projectId, 'should have projectId');
    assert.ok(result.dirPath, 'should have dirPath');
    assert.ok(result.metadata, 'should have metadata');
    assert.strictEqual(result.metadata.prefix, 'test-project');
    
    const dirExists = await fs.access(result.dirPath).then(() => true).catch(() => false);
    assert.strictEqual(dirExists, true, 'directory should exist');
  });

  test('should create file in project', async () => {
    const { projectId } = await tempManager.createProjectDir('file-test');
    
    const fileResult = await tempManager.createFile(
      projectId,
      'test.txt',
      'Hello World'
    );
    
    assert.strictEqual(fileResult.filePath, 'test.txt');
    assert.ok(fileResult.fullPath, 'should have fullPath');
    assert.strictEqual(fileResult.size, 11, 'file size should be 11');
    
    const content = await fs.readFile(fileResult.fullPath, 'utf8');
    assert.strictEqual(content, 'Hello World');
  });

  test('should create nested file in project', async () => {
    const { projectId } = await tempManager.createProjectDir('nested-test');
    
    await tempManager.createFile(
      projectId,
      'src/components/Test.vue',
      '<template><div>Test</div></template>'
    );
    
    const metadata = tempManager.activeProjects.get(projectId);
    assert.ok(metadata.files.length > 0, 'should have files recorded');
  });

  test('should throw error when creating file with invalid projectId', async () => {
    await assert.rejects(
      tempManager.createFile('invalid-id', 'test.txt', 'content'),
      { message: 'Project invalid-id not found' }
    );
  });

  test('should get project info', async () => {
    const { projectId } = await tempManager.createProjectDir('info-test');
    
    await tempManager.createFile(projectId, 'package.json', '{"name": "test"}');
    
    const info = await tempManager.getProjectInfo(projectId);
    
    assert.strictEqual(info.projectId, projectId);
    assert.ok(info.dirPath, 'should have dirPath');
    assert.ok(info.createdAt, 'should have createdAt');
    assert.ok(info.age >= 0, 'age should be >= 0');
    assert.ok(info.fileCount > 0, 'should have files');
    assert.ok(info.totalSize > 0, 'totalSize should be > 0');
  });

  test('should throw error when getting info with invalid projectId', async () => {
    await assert.rejects(
      tempManager.getProjectInfo('invalid-id'),
      { message: 'Project invalid-id not found' }
    );
  });

  test('should delete project', async () => {
    const { projectId, dirPath } = await tempManager.createProjectDir('delete-test');
    
    const result = await tempManager.deleteProject(projectId);
    
    assert.strictEqual(result, true, 'should return true');
    assert.strictEqual(tempManager.activeProjects.has(projectId), false, 'should be removed from Map');
    
    const dirExists = await fs.access(dirPath).then(() => true).catch(() => false);
    assert.strictEqual(dirExists, false, 'directory should be deleted');
  });

  test('should return false when deleting non-existent project', async () => {
    const result = await tempManager.deleteProject('non-existent-id');
    assert.strictEqual(result, false, 'should return false');
  });

  test('should get stats', async () => {
    await tempManager.createProjectDir('stats-test-1');
    await tempManager.createProjectDir('stats-test-2');
    
    const stats = tempManager.getStats();
    
    assert.ok(stats.baseDir, 'should have baseDir');
    assert.ok(stats.maxAge, 'should have maxAge');
    assert.ok(stats.cleanupInterval, 'should have cleanupInterval');
    assert.ok(stats.totalProjects >= 2, 'should have projects');
    assert.ok(Array.isArray(stats.projects), 'projects should be array');
  });

  test('should cleanup expired projects', async () => {
    const shortLivedManager = new TempManager({
      baseDir: path.join(process.cwd(), 'temp', 'expire-test'),
      maxAge: 1,
      cleanupInterval: 100
    });
    
    await shortLivedManager.createProjectDir('expire-test');
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const cleanedCount = await shortLivedManager.cleanupExpired();
    assert.ok(cleanedCount >= 0, 'should return count');
    
    await shortLivedManager.cleanupAll();
  });

  test('should cleanup all projects', async () => {
    const cleanupManager = new TempManager({
      baseDir: path.join(process.cwd(), 'temp', 'cleanup-all-test')
    });
    
    await cleanupManager.createProjectDir('cleanup-1');
    await cleanupManager.createProjectDir('cleanup-2');
    
    const result = await cleanupManager.cleanupAll();
    
    assert.ok(result.total >= 0, 'should have total');
    assert.ok(result.success >= 0, 'should have success');
  });
});
