class PromptEngineer {
  static designToPrompt(designSpec) {
    const {
      name = 'Vue2 Application',
      description = '',
      requirements = '',
      style = '',
      components = [],
      pages = [],
      features = [],
      target = 'web'
    } = designSpec;

    const componentList = this.formatComponents(components);
    const pageList = this.formatPages(pages);
    const featureList = this.formatFeatures(features);

    return `
      作为资深前端架构师，请生成一个完整、专业、可立即运行的Vue2项目。

      ## 项目概览
      **项目名称**: ${name}
      **项目描述**: ${description || '现代化Vue2应用程序'}
      **设计要求**: ${requirements || '创建简洁、现代、用户友好的界面'}
      **设计风格**: ${style || '科技风，简约易用，色彩协调，响应式设计'}

      ## 核心功能
      ${featureList}

      ## 组件需求
      ${componentList}

      ## 页面需求
      ${pageList}

      ## 技术要求（必须严格遵守）
      1. **框架**: Vue 2.6+ (必须使用Options API，非Composition API)
      2. **路由**: Vue Router 3.x 用于页面导航
      3. **状态管理**: 如有复杂状态需求，使用Vuex 3.x
      4. **HTTP客户端**: 使用Axios进行API调用
      5. **样式**: 使用Scoped CSS进行样式隔离，支持响应式设计
      6. **代码规范**: 
         - 使用ES6+语法
         - 组件使用PascalCase命名（如UserProfile.vue）
         - 变量使用camelCase命名
         - 常量使用UPPER_SNAKE_CASE
         - 添加必要的JSDoc注释
      7. **项目结构**: 遵循Vue CLI标准结构
      8. **性能优化**: 按需加载组件，图片懒加载，代码分割

      ## 必须包含的文件和目录结构
      请生成完整的项目结构，包括以下关键文件：

      1. **package.json** - 包含所有依赖和脚本
         - Vue 2.6.14
         - Vue Router 3.5.1
         - Vuex 3.6.2 (如需要)
         - Axios 0.27.2
         - 开发依赖：@vue/cli-service, vue-template-compiler等

      2. **vue.config.js** - Vue CLI配置
         - 开发服务器配置
         - 生产构建优化
         - CSS提取配置

      3. **src/main.js** - 应用入口点
         - Vue实例化
         - 路由和Store注册
         - 全局组件注册
         - 错误处理

      4. **src/App.vue** - 根组件
         - 布局框架
         - 路由视图
         - 全局导航
         - 页脚信息

      5. **src/components/** - 可复用组件目录
         - 通用UI组件（Button, Input, Card, Modal等）
         - 业务组件
         - 每个组件独立的.vue文件

      6. **src/views/** - 页面组件目录
         - 每个路由对应的页面
         - 页面级组件

      7. **src/router/index.js** - 路由配置
         - 路由定义
         - 路由守卫
         - 懒加载配置

      8. **src/store/** - Vuex Store（如需要）
         - State管理
         - Mutations, Actions, Getters

      9. **src/assets/** - 静态资源
         - CSS/SCSS文件
         - 图片资源
         - 字体文件

      10. **src/utils/** - 工具函数
          - API封装
          - 工具类
          - 常量定义

      11. **public/index.html** - HTML模板
          - 基础HTML结构
          - 元标签
          - 引入基础CSS

      12. **配置文件**
          - .gitignore
          - .env.example
          - README.md
          - 如有需要，添加.eslintrc.js

      ## 设计原则
      1. **简洁性**: 代码简洁明了，避免过度设计
      2. **可维护性**: 组件职责单一，易于测试和维护
      3. **可扩展性**: 架构支持未来功能扩展
      4. **用户体验**: 关注交互细节和视觉反馈
      5. **性能**: 优化加载速度和运行时性能

      ## 输出格式要求
      请以JSON格式返回，结构如下：
      {
        "project_structure": {
          "文件路径1": "完整文件内容1",
          "文件路径2": "完整文件内容2",
          ...
        },
        "explanation": "项目架构说明和技术选择理由"
      }

      注意：文件路径使用正斜杠(/)作为分隔符，所有文件内容必须是完整、可运行的代码。
    `;
  }

  static formatComponents(components) {
    if (!components || components.length === 0) {
      return `需要创建以下基础组件：
      1. AppHeader - 顶部导航栏，包含Logo和主导航
      2. AppFooter - 页脚，包含版权信息和链接
      3. MainContent - 主要内容区域容器
      4. BaseButton - 基础按钮组件，支持多种样式
      5. BaseInput - 基础输入框组件，支持验证`;
    }

    return components.map((comp, index) => {
      const { name, description, props = [], events = [], slots = [] } = comp;
      return `
      ${index + 1}. ${name} - ${description}
         Props: ${props.length > 0 ? props.map(p => `${p.name}: ${p.type}`).join(', ') : '无'}
         Events: ${events.length > 0 ? events.map(e => e).join(', ') : '无'}
         Slots: ${slots.length > 0 ? slots.map(s => s).join(', ') : '无'}`;
    }).join('\n');
  }

  static formatPages(pages) {
    if (!pages || pages.length === 0) {
      return `需要创建以下基础页面：
      1. HomePage - 首页，展示主要功能和内容
      2. AboutPage - 关于页面，介绍项目或公司
      3. ContactPage - 联系页面，包含联系表单和信息`;
    }

    return pages.map((page, index) => {
      const { name, description, route, components = [] } = page;
      return `
      ${index + 1}. ${name} - ${description}
         路由: ${route || `/${name.toLowerCase()}`}
         包含组件: ${components.length > 0 ? components.join(', ') : '基础布局组件'}`;
    }).join('\n');
  }

  static formatFeatures(features) {
    if (!features || features.length === 0) {
      return `1. 响应式布局 - 支持桌面、平板、手机等多种设备
      2. 表单验证 - 客户端表单验证和错误提示
      3. 路由导航 - 页面间无缝切换，支持浏览器历史
      4. API集成 - 与后端服务进行数据交互
      5. 状态管理 - 跨组件状态共享和管理
      6. 国际化支持 - 多语言切换（如有需要）
      7. 主题切换 - 深色/浅色模式（如有需要）`;
    }

    return features.map((feature, index) => `${index + 1}. ${feature}`).join('\n');
  }

  static bankWebsitePrompt(bankName, requirements) {
    return this.designToPrompt({
      name: `${bankName}官方网站`,
      description: `${bankName}官方银行网站，提供银行服务介绍、产品展示、在线办理等功能`,
      requirements: requirements || '科技感强，金融行业风格，安全可信，用户体验优秀',
      style: '科技金融风，专业稳重，蓝色系为主，简约现代，符合银行行业形象',
      components: [
        {
          name: 'BankHeader',
          description: '银行网站顶部导航，包含Logo、主菜单、用户登录状态',
          props: ['isLoggedIn: Boolean', 'userName: String'],
          events: ['logout', 'login']
        },
        {
          name: 'ServiceCard',
          description: '银行服务展示卡片，展示存款、贷款、理财等服务',
          props: ['service: Object', 'index: Number'],
          events: ['click']
        },
        {
          name: 'ProductGrid',
          description: '金融产品网格展示，支持筛选和排序',
          props: ['products: Array', 'filter: Object'],
          events: ['filter-change', 'sort-change']
        },
        {
          name: 'SecurityBadge',
          description: '安全认证徽章，增强用户信任感',
          props: ['level: String', 'type: String']
        }
      ],
      pages: [
        {
          name: 'HomePage',
          description: '首页，展示银行核心服务和最新活动',
          route: '/',
          components: ['BankHeader', 'ServiceCard', 'ProductGrid', 'SecurityBadge']
        },
        {
          name: 'ProductsPage',
          description: '产品页面，展示所有金融产品',
          route: '/products',
          components: ['ProductGrid', 'FilterPanel']
        },
        {
          name: 'ServicesPage',
          description: '服务页面，详细介绍银行各项服务',
          route: '/services',
          components: ['ServiceCard', 'ServiceDetail']
        },
        {
          name: 'ContactPage',
          description: '联系页面，包含分支机构地图和联系方式',
          route: '/contact',
          components: ['ContactForm', 'BranchMap']
        }
      ],
      features: [
        '响应式设计，适配所有设备',
        '安全的用户认证和会话管理',
        '金融产品筛选和对比功能',
        '在线预约和办理服务',
        '实时汇率和利率展示',
        '分支机构定位和导航',
        '多语言支持（中英文）',
        '无障碍访问支持'
      ]
    });
  }

  static ecommercePrompt(storeName, requirements) {
    return this.designToPrompt({
      name: `${storeName}电商平台`,
      description: `${storeName}在线购物平台，支持商品浏览、购物车、订单管理等功能`,
      requirements: requirements || '购物体验流畅，视觉吸引力强，转化率高',
      style: '现代电商风格，色彩鲜明，购物引导明确，响应式设计',
      features: [
        '商品分类和筛选',
        '购物车和收藏功能',
        '用户评价和评分',
        '订单跟踪和管理',
        '支付集成',
        '推荐系统',
        '优惠券和促销活动'
      ]
    });
  }

  static adminDashboardPrompt(appName, requirements) {
    return this.designToPrompt({
      name: `${appName}管理后台`,
      description: `${appName}系统管理后台，提供数据监控、用户管理、系统配置等功能`,
      requirements: requirements || '数据可视化，操作高效，权限管理严格',
      style: '专业管理后台风格，深色/浅色主题，数据图表丰富，操作便捷',
      features: [
        '数据统计和图表展示',
        '用户角色和权限管理',
        '系统日志和监控',
        '批量操作和导入导出',
        '实时通知和告警',
        '配置管理和系统设置'
      ]
    });
  }
}

export default PromptEngineer;