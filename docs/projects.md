# Vue2 Vite 多项目模板系统

基于 template 模板生成多个独立项目，使用 pnpm workspace 管理依赖。

## 目录结构

```
.
├── template/          # 项目模板（不可修改）
│   ├── src/           # 模板源码
│   ├── package.json
│   └── vite.config.js
├── projects/          # 生成的项目
│   ├── oa-system/
│   └── hr-system/
├── scripts/           # 脚本工具
│   └── generator.cjs  # 项目生成器
├── pnpm-workspace.yaml
└── package.json       # 根目录配置
```

## 快速开始

### 生成项目

```bash
node scripts/generator.cjs
```

### 手动启动

```bash
cd projects/项目名
pnpm run dev
```

### pnpm workspace 安装

```bash
pnpm install
```

## 端口配置

| 项目 | 端口 |
|------|------|
| oa-system | 3001 |
| hr-system | 3002 |

## 新增项目

在 `scripts/generator.cjs` 的 `projects` 数组中添加配置：

```javascript
const projects = [
  { name: '新项目名', title: '页面标题' }
]
```
