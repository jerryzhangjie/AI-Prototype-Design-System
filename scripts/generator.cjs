const fs = require('fs')
const path = require('path')
const { exec, spawn } = require('child_process')

const ROOT_DIR = path.join(__dirname, '..')
const TEMPLATE_DIR = path.join(ROOT_DIR, 'template')
const PROJECTS_DIR = path.join(ROOT_DIR, 'projects')

const PORTS = {
  'oa-system': 3001,
  'hr-system': 3002
}

function log(msg) {
  console.log(`[Generator] ${msg}`)
}

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

function updatePackageJson(projectDir, projectName) {
  const pkgPath = path.join(projectDir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.name = projectName
  pkg.scripts.dev = `vite --port ${getPort(projectName)}`
  pkg.devDependencies = pkg.devDependencies || {}
  pkg.devDependencies.pnpm = '^10.0.0'
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
}

function getPort(projectName) {
  return PORTS[projectName] || 3000 + Math.floor(Math.random() * 1000)
}

function generateLoginPage(projectDir, title) {
  const homePath = path.join(projectDir, 'src/views/Home.vue')
  const content = `<template>
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
h1 { text-align: center; color: #333; margin-bottom: 30px; }
.form-item { margin-bottom: 20px; }
input {
  width: 100%; padding: 12px; border: 1px solid #ddd;
  border-radius: 5px; font-size: 14px; box-sizing: border-box;
}
.login-btn {
  width: 100%; padding: 12px; background: #667eea;
  color: white; border: none; border-radius: 5px;
  font-size: 16px; cursor: pointer;
}
.login-btn:hover { background: #5568d3; }
</style>
`
  fs.writeFileSync(homePath, content)
  log(`生成登录页: ${homePath}`)
}

function runCommand(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr)
        reject(err)
      } else {
        resolve(stdout)
      }
    })
  })
}

function startServer(projectDir, projectName) {
  const port = getPort(projectName)
  log(`启动 ${projectName} (http://localhost:${port})`)
  spawn('pnpm', ['run', 'dev'], { cwd: projectDir, stdio: 'inherit' })
}

async function createProject(name, title) {
  const projectDir = path.join(PROJECTS_DIR, name)
  
  if (fs.existsSync(projectDir)) {
    log(`项目 ${name} 已存在，跳过创建`)
    return projectDir
  }
  
  log(`创建项目: ${name}`)
  copyDir(TEMPLATE_DIR, projectDir)
  updatePackageJson(projectDir, name)
  generateLoginPage(projectDir, title)
  
  await runCommand('pnpm install', projectDir)
  
  return projectDir
}

async function main() {
  const projects = [
    { name: 'oa-system', title: 'OA系统登录' },
    { name: 'hr-system', title: 'HR系统登录' }
  ]
  
  log('开始生成项目')
  
  for (const proj of projects) {
    const projectDir = await createProject(proj.name, proj.title)
    startServer(projectDir, proj.name)
  }
  
  log('=== 项目启动完成 ===')
  log('OA系统: http://localhost:3001')
  log('HR系统: http://localhost:3002')
}

main().catch(console.error)
