#!/usr/bin/env node

import VueProjectGenerator from '../src/lib/vue-project-generator.js';
import fs from 'fs/promises';
import path from 'path';

async function generateTemplateProject() {
  console.log('=== 生成模板项目测试 ===\n');
  
  // 使用本地temp目录而不是系统临时目录
  const tempDir = path.join(process.cwd(), 'temp', 'projects');
  await fs.mkdir(tempDir, { recursive: true });
  
  const generator = new VueProjectGenerator({
    serverUrl: 'http://127.0.0.1:4096',
    tempDir
  });

  const designRequirements = {
    name: '测试模板项目',
    description: '使用模板生成的Vue2项目',
    style: '简约现代',
    requirements: '基本的Vue2项目结构',
    components: [],
    pages: ['首页'],
    features: ['响应式设计']
  };

  console.log('设计需求:', JSON.stringify(designRequirements, null, 2));
  console.log('\n开始生成项目（使用模板）...');

  const result = await generator.generateProject(designRequirements, {
    timeout: 10000
  });

  console.log('\n=== 生成结果 ===');
  console.log('成功:', result.success);
  
  if (result.success) {
    console.log('项目ID:', result.projectId);
    console.log('项目目录:', result.projectDir);
    console.log('文件数:', result.files.length);
    console.log('总大小:', result.totalSize, 'bytes');
    console.log('说明:', result.explanation);
    console.log('来源:', result.source);
    
    // 列出前10个文件
    console.log('\n=== 生成的文件（前10个）===');
    result.files.slice(0, 10).forEach(file => {
      console.log(`  ${file.path} (${file.size} bytes)`);
    });
    
    if (result.files.length > 10) {
      console.log(`  ... 还有 ${result.files.length - 10} 个文件`);
    }
    
    // 检查关键文件内容
    console.log('\n=== 关键文件预览 ===');
    const criticalFiles = ['package.json', 'src/App.vue', 'src/main.js', 'public/index.html'];
    for (const file of criticalFiles) {
      try {
        const filePath = path.join(result.projectDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        console.log(`\n📄 ${file} (${content.length} 字符):`);
        console.log('--- 前200字符 ---');
        console.log(content.substring(0, 200) + (content.length > 200 ? '...' : ''));
      } catch (error) {
        console.log(`\n❌ ${file}: ${error.message}`);
      }
    }
    
    // 项目结构
    console.log('\n=== 项目结构 ===');
    async function walk(dir, indent = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          console.log(`${indent}📁 ${entry.name}/`);
          await walk(fullPath, indent + '  ');
        } else {
          const stats = await fs.stat(fullPath);
          console.log(`${indent}📄 ${entry.name} (${stats.size} bytes)`);
        }
      }
    }
    
    await walk(result.projectDir);
    
    // 询问是否清理
    console.log('\n=== 操作选项 ===');
    console.log('1. 保留项目目录');
    console.log('2. 清理项目目录');
    console.log('3. 打开项目目录');
    
    // 简单等待然后清理
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('\n自动清理项目目录...');
    await fs.rm(result.projectDir, { recursive: true, force: true });
    console.log('清理完成');
    
  } else {
    console.log('错误:', result.error);
  }
}

// 运行
generateTemplateProject().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});