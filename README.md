# AI Prototype Design System

基于OpenCode SDK的AI原型设计系统，允许用户通过自然语言描述生成完整的Vue2项目。

## 功能特性

- 🚀 **AI驱动设计**：使用OpenCode SDK将自然语言描述转换为完整Vue2项目
- 📦 **完整项目生成**：生成包含package.json、Vue组件、路由、配置的完整项目
- 🔧 **原生Node.js**：使用原生HTTP模块，无Express依赖
- 🏗️ **Vue2专注**：专门针对Vue2框架优化，使用Options API
- 📁 **临时目录管理**：自动清理过期项目，资源管理高效
- 🔒 **安全可靠**：请求限流、输入验证、错误处理完善
- 📊 **实时监控**：健康检查、状态监控、详细日志记录

## 系统架构

```
前端页面 → Node.js HTTP服务 → OpenCode SDK → OpenCode服务器 → AI模型 → 生成代码
```

### 核心模块

1. **OpenCode管理器** (`lib/opencode-manager.js`) - 管理OpenCode服务器进程
2. **OpenCode客户端** (`lib/opencode-client.js`) - OpenCode SDK封装
3. **Vue项目生成器** (`lib/vue-project-generator.js`) - Vue2项目构建
4. **提示词工程师** (`lib/prompt-engineer.js`) - 设计需求转提示词
5. **临时目录管理器** (`lib/temp-manager.js`) - 临时文件管理
6. **HTTP路由器** (`lib/router.js`) - 原生HTTP路由
7. **中间件系统** (`lib/middleware.js`) - 请求处理中间件
8. **日志系统** (`lib/logger.js`) - 结构化日志记录
9. **错误处理** (`lib/error-handler.js`) - 自定义错误类

## 快速开始

### 前提条件

1. **Node.js** 16+ 
2. **OpenCode CLI** 已安装
   ```bash
   npm install -g opencode-ai
   # 或使用安装脚本
   curl -fsSL https://opencode.ai/install | bash
   ```

### 安装步骤

1. **克隆或下载项目**
   ```bash
   git clone <repository-url>
   cd ux-opencode-demo
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 根据需要编辑 .env 文件
   ```

4. **启动服务**
   ```bash
   npm start
   # 开发模式
   npm run dev
   ```

5. **验证服务**
   ```bash
   curl http://localhost:3000/api/health
   ```

## API接口

### 1. 健康检查
```http
GET /api/health
```
响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "opencode": "healthy",
    "tempManager": "healthy"
  },
  "uptime": 123.456
}
```

### 2. 状态检查
```http
GET /api/status
```
获取系统详细状态信息。

### 3. 生成Vue2项目
```http
POST /api/generate
Content-Type: application/json

{
  "design": {
    "name": "宁波银行官网",
    "description": "设计宁波银行官网，要求科技风，简约易用",
    "requirements": "包含首页、产品展示、服务介绍、联系我们等页面",
    "style": "科技金融风，蓝色系为主，简洁现代",
    "components": [
      {
        "name": "BankHeader",
        "description": "银行网站顶部导航"
      }
    ],
    "pages": [
      {
        "name": "HomePage",
        "description": "首页",
        "route": "/"
      }
    ],
    "features": [
      "响应式设计",
      "用户登录",
      "产品筛选"
    ]
  },
  "options": {
    "model": {
      "providerID": "opencode",
      "modelID": "claude-3-5-sonnet-20241022"
    }
  }
}
```

响应：
```json
{
  "success": true,
  "projectId": "uuid-here",
  "projectDir": "/path/to/temp/dir",
  "files": [...],
  "totalSize": 123456,
  "explanation": "生成的Vue2项目包含...",
  "downloadUrl": "/api/download/uuid-here",
  "infoUrl": "/api/project/uuid-here",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. 下载项目
```http
GET /api/download/{projectId}
```
返回ZIP压缩包。

### 5. 获取项目信息
```http
GET /api/project/{projectId}
```

### 6. 删除项目
```http
DELETE /api/project/{projectId}
```

## 配置说明

### 环境变量
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 3000 | 服务器端口 |
| OPENCODE_SERVER_PORT | 4096 | OpenCode服务器端口 |
| LOG_LEVEL | info | 日志级别 (error, warn, info, debug) |
| RATE_LIMIT_MAX | 100 | 每15分钟最大请求数 |
| TEMP_MAX_AGE | 86400000 | 临时文件最大存活时间(24小时) |

### OpenCode配置
系统使用全局OpenCode服务器，确保已安装并配置：
```bash
opencode serve --port 4096
```

## 使用示例

### 生成银行官网
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "design": {
      "name": "宁波银行官网",
      "description": "设计宁波银行官网，要求科技风，简约易用",
      "style": "科技金融风，蓝色系为主"
    }
  }'
```

### 生成电商网站
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "design": {
      "name": "电商平台",
      "description": "设计现代化电商平台，支持商品浏览、购物车、订单管理",
      "style": "现代电商风格，色彩鲜明"
    }
  }'
```

## 项目结构

```
ai-prototype-design-system/
├── package.json                 # Node.js服务配置
├── .env.example                 # 环境变量示例
├── src/                         # 源代码目录
│   ├── index.js                 # 主服务器入口
│   └── lib/                     # 核心模块
│       ├── opencode-manager.js      # OpenCode服务器管理
│       ├── opencode-client.js       # OpenCode SDK客户端
│       ├── vue-project-generator.js # Vue2项目生成器
│       ├── prompt-engineer.js       # 提示词工程
│       ├── temp-manager.js          # 临时目录管理
│       ├── router.js                # HTTP路由器
│       ├── middleware.js            # 中间件系统
│       ├── logger.js                # 日志系统
│       └── error-handler.js         # 错误处理
├── logs/                        # 应用日志目录
├── temp/                        # 临时文件目录
│   ├── projects/                # 生成的Vue项目
│   └── cache/                   # 缓存文件
├── tests/                       # 测试文件
│   ├── unit/                    # 单元测试
│   └── integration/             # 集成测试
├── config/                      # 配置文件
├── scripts/                     # 实用脚本
└── docs/                       # 文档
```

## 开发指南

### 添加新框架支持
1. 在 `lib/vue-project-generator.js` 中添加新框架模板
2. 在 `lib/prompt-engineer.js` 中添加对应提示词模板
3. 更新路由处理器支持框架选择

### 扩展API
1. 在 `index.js` 的 `setupRoutes` 方法中添加新路由
2. 创建对应的处理器方法
3. 更新中间件配置（如果需要）

### 测试
```bash
# 运行健康检查
curl http://localhost:3000/api/health

# 测试生成功能
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"design": {"description": "测试页面"}}'
```

## 故障排除

### OpenCode服务器无法启动
1. 检查OpenCode是否已安装：`opencode --version`
2. 检查端口4096是否被占用
3. 查看日志：`tail -f logs/app.log`

### 生成失败
1. 检查OpenCode服务器状态：`curl http://localhost:4096/global/health`
2. 查看详细错误日志
3. 验证设计描述的清晰度

### 内存使用过高
1. 调整临时文件清理频率
2. 减少并发请求数
3. 增加服务器内存

## 性能优化

1. **缓存策略**：对相似设计进行结果缓存
2. **并发控制**：限制同时处理的生成请求
3. **资源清理**：定期清理临时文件和过期会话
4. **流式响应**：大文件使用流式传输

## 安全建议

1. **API密钥安全**：不要将API密钥提交到版本控制
2. **输入验证**：对所有用户输入进行严格验证
3. **请求限流**：防止滥用和DDoS攻击
4. **错误信息**：生产环境隐藏详细错误信息
5. **文件权限**：临时目录设置适当权限

## 许可证

MIT License

## 支持与贡献

欢迎提交Issue和Pull Request。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持Vue2项目生成
- 完整的API接口
- 临时文件管理
- 日志和错误处理系统