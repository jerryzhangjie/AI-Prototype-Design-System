const fs = require('fs')
const path = require('path')
const { exec, spawn } = require('child_process')
const readline = require('readline')

const TEMPLATE_DIR = path.join(__dirname, '..', 'template')
const PROJECTS_DIR = path.join(__dirname, '..', 'projects')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function copyTemplate(projectName) {
  const targetDir = path.join(PROJECTS_DIR, projectName)
  
  if (fs.existsSync(targetDir)) {
    console.log(`项目 ${projectName} 已存在`)
    return targetDir
  }

  console.log(`正在创建项目: ${projectName}`)
  
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    const entries = fs.readdirSync(src, { withFileTypes: true })
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
  
  copyDir(TEMPLATE_DIR, targetDir)
  
  const pkgPath = path.join(targetDir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.name = projectName
  pkg.scripts.dev = `vite --port ${getPort(projectName)}`
  pkg.devDependencies = pkg.devDependencies || {}
  pkg.devDependencies.pnpm = '^10.0.0'
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  
  return targetDir
}

function getPort(projectName) {
  const ports = {
    'oa-system': 3001,
    'hr-system': 3002
  }
  return ports[projectName] || 3000 + Math.floor(Math.random() * 1000)
}

function generateLoginPage(projectName, title) {
  const targetDir = path.join(PROJECTS_DIR, projectName)
  const homePath = path.join(targetDir, 'src/views/Home.vue')
  
  const loginContent = `<template>
  <div class="login-container">
    <div class="login-box">
      <h1>${title}</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-item">
          <input type="text" v-model="username" placeholder="用户名" />
        </div>
        <div class="form-item">
          <input type="password" v-model="password" placeholder="密码" />
        </div>
        <button type="submit" class="login-btn">登录</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    handleLogin() {
      alert(\`\${this.username} 登录成功!\`)
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  width: 350px;
}
h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}
.form-item {
  margin-bottom: 20px;
}
input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  box-sizing: border-box;
}
.login-btn {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}
.login-btn:hover {
  background: #5568d3;
}
</style>
`
  
  fs.writeFileSync(homePath, loginContent)
  console.log(`已生成登录页: ${projectName}`)
}

async function installDeps(projectDir) {
  return new Promise((resolve, reject) => {
    console.log('正在安装依赖...')
    exec('pnpm install', { cwd: projectDir }, (err) => {
      if (err) {
        console.error('安装依赖失败:', err)
        reject(err)
      } else {
        console.log('依赖安装完成')
        resolve()
      }
    })
  })
}

function startDevServer(projectDir, projectName) {
  console.log(`正在启动 ${projectName} 开发服务器...`)
  const child = spawn('pnpm', ['run', 'dev'], { 
    cwd: projectDir,
    stdio: 'inherit'
  })
  return child
}

async function main() {
  const projects = [
    { name: 'oa-system', title: 'OA系统登录' },
    { name: 'hr-system', title: 'HR系统登录' }
  ]
  
  console.log('=== 开始生成项目 ===\n')
  
  for (const proj of projects) {
    console.log(`\n--- 生成 ${proj.name} ---`)
    const projectDir = await copyTemplate(proj.name)
    generateLoginPage(proj.name, proj.title)
    await installDeps(projectDir)
    startDevServer(projectDir, proj.name)
  }
  
  console.log('\n=== 所有项目已启动 ===')
  console.log('OA系统: http://localhost:3001')
  console.log('HR系统: http://localhost:3002')
  
  rl.close()
}

main().catch(console.error)
