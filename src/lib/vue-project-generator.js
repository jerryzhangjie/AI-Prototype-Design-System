import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { OpenCodeClient } from './opencode-client.js';

class VueProjectGenerator {
  constructor(options = {}) {
    this.openCodeClient = new OpenCodeClient(options.serverUrl);
    this.tempDir = options.tempDir || path.join(process.cwd(), 'temp_projects');
  }

  async generateProject(designRequirements, options = {}) {
    const projectId = uuidv4();
    const projectDir = path.join(this.tempDir, projectId);
    
    try {
      await fs.mkdir(projectDir, { recursive: true });
      console.log(`Created project directory: ${projectDir}`);

      let openCodeSuccess = false;
      let openCodeFiles = {};
      let explanation = '使用模板文件生成的Vue2项目';

      // 尝试使用OpenCode生成项目
      try {
        const prompt = this.buildProjectPrompt(designRequirements);
        
        console.log('Sending request to OpenCode...');
        const result = await this.openCodeClient.generateVueProject(prompt, {
          title: `Vue2 Project - ${designRequirements.name || 'Generated Project'}`,
          ...options
        });

        if (result.success && result.files && Object.keys(result.files).length > 0) {
          openCodeSuccess = true;
          openCodeFiles = result.files;
          explanation = result.explanation || 'OpenCode生成的Vue2项目';
          console.log(`OpenCode生成成功，获得${Object.keys(result.files).length}个文件`);
        } else {
          console.log('OpenCode生成失败或返回空文件，使用模板文件');
        }
      } catch (openCodeError) {
        console.log('OpenCode生成异常，使用模板文件:', openCodeError.message);
      }

      // 使用OpenCode生成的文件或模板文件
      if (openCodeSuccess && Object.keys(openCodeFiles).length > 0) {
        await this.writeProjectFiles(projectDir, openCodeFiles);
      }
      
      // 确保所有必要文件都存在（模板文件会填补缺失的）
      await this.ensureEssentialFiles(projectDir, designRequirements);

      const projectInfo = await this.collectProjectInfo(projectDir);

      return {
        success: true,
        projectId,
        projectDir,
        files: projectInfo.files,
        totalSize: projectInfo.totalSize,
        explanation,
        downloadPath: path.join(projectDir, 'project.zip'),
        source: openCodeSuccess ? 'opencode' : 'template'
      };

    } catch (error) {
      console.error('Project generation error:', error);
      
      try {
        await fs.rm(projectDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Failed to cleanup project directory:', cleanupError);
      }

      return {
        success: false,
        error: error.message,
        projectId: null,
        projectDir: null
      };
    }
  }

  buildProjectPrompt(requirements) {
    const { name, description } = requirements;
    
    // 简化提示，只请求最重要的文件
    return `
请为Vue2项目生成package.json文件。
项目名称：${name || 'vue2-project'}
项目描述：${description || 'Vue2项目'}

请以JSON格式返回：{"files": {"package.json": "完整的package.json内容"}}
将JSON包裹在\`\`\`json ... \`\`\`代码块中。
    `;
  }

  async writeProjectFiles(projectDir, files) {
    console.log(`Writing ${Object.keys(files).length} files to project...`);

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(projectDir, filePath);
      const dir = path.dirname(fullPath);

      try {
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');
      } catch (error) {
        console.error(`Failed to write file ${filePath}:`, error);
        throw error;
      }
    }

    console.log('All files written successfully');
  }

  async ensureEssentialFiles(projectDir, requirements) {
    const essentialFiles = {
      'package.json': this.generatePackageJson(requirements),
      'vue.config.js': this.generateVueConfig(),
      'src/main.js': this.generateMainJs(),
      'src/App.vue': this.generateAppVue(requirements),
      'public/index.html': this.generateIndexHtml(requirements),
      '.gitignore': this.generateGitIgnore(),
      'README.md': this.generateReadme(requirements)
    };

    for (const [filePath, content] of Object.entries(essentialFiles)) {
      const fullPath = path.join(projectDir, filePath);
      
      try {
        await fs.access(fullPath);
      } catch {
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');
        console.log(`Created essential file: ${filePath}`);
      }
    }
  }

  generatePackageJson(requirements) {
    return JSON.stringify({
      name: requirements.name?.toLowerCase().replace(/\s+/g, '-') || 'vue2-generated-project',
      version: '1.0.0',
      description: requirements.description || 'AI-generated Vue2 project',
      private: true,
      scripts: {
        serve: 'vue-cli-service serve',
        build: 'vue-cli-service build',
        lint: 'vue-cli-service lint'
      },
      dependencies: {
        'vue': '^2.6.14',
        'vue-router': '^3.5.1',
        'vuex': '^3.6.2',
        'axios': '^0.27.2'
      },
      devDependencies: {
        '@vue/cli-service': '~5.0.8',
        'vue-template-compiler': '^2.6.14'
      },
      browserslist: [
        '> 1%',
        'last 2 versions',
        'not dead'
      ]
    }, null, 2);
  }

  generateVueConfig() {
    return `module.exports = {
  lintOnSave: false,
  productionSourceMap: false,
  css: {
    extract: true,
    sourceMap: false
  },
  devServer: {
    port: 8080,
    open: true,
    hot: true
  }
}`;
  }

  generateMainJs() {
    return `import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')`;
  }

  generateAppVue(requirements) {
    return `<template>
  <div id="app">
    <header>
      <h1>{{ appTitle }}</h1>
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <p>Generated with AI Prototype Design System</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      appTitle: '${requirements.name || 'Vue2 Generated Project'}'
    }
  }
}
</script>

<style scoped>
#app {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>`;
  }

  generateIndexHtml(requirements) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>${requirements.name || 'Vue2 Generated Project'}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
  </head>
  <body>
    <noscript>
      <strong>We're sorry but this application doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
    </noscript>
    <div id="app"></div>
    <!-- built files will be auto injected -->
  </body>
</html>`;
  }

  generateGitIgnore() {
    return `node_modules/
dist/
.env
*.log
.DS_Store
`;
  }

  generateReadme(requirements) {
    return `# ${requirements.name || 'Vue2 Generated Project'}

${requirements.description || 'This project was generated using the AI Prototype Design System.'}

## Project Structure

\`\`\`
src/
├── main.js          # Application entry point
├── App.vue          # Root component
├── components/      # Reusable components
├── views/           # Page components
├── router/          # Vue Router configuration
├── store/           # Vuex store (if needed)
└── assets/          # Static assets
\`\`\`

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm run serve
   \`\`\`

3. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

## Features

${requirements.features ? requirements.features.map(f => `- ${f}`).join('\n') : '- Modern Vue2 architecture\n- Vue Router for navigation\n- Responsive design'}

## Generated by

AI Prototype Design System powered by OpenCode SDK
`;
  }

  async collectProjectInfo(projectDir) {
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

    await scanDir(projectDir);
    
    return {
      files: files.sort((a, b) => a.path.localeCompare(b.path)),
      totalSize
    };
  }
}

export default VueProjectGenerator;