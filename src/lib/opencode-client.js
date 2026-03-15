export class OpenCodeClient {
  constructor(serverUrl = 'http://127.0.0.1:4096') {
    this.serverUrl = serverUrl;
  }

   async #fetchApi(endpoint, options = {}) {
    const url = `${this.serverUrl}${endpoint}`;
    const timeout = options.timeout || 120000;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenCode API error (${response.status}): ${errorText}`);
      }
      
      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateVueProject(prompt, options = {}) {
    try {
      console.log('Creating session for Vue project generation...');
      
       const session = await this.#fetchApi('/session', {
        method: 'POST',
        body: JSON.stringify({
          title: options.title || 'Vue2 Project Generation'
        }),
        timeout: 10000
      });
      
      console.log(`Session created: ${session.id}`);
      
       const requestBody = {
        parts: [{ type: 'text', text: prompt }],
        max_tokens: 4000,
        temperature: 0.2
      };
      
      if (options.model) {
        requestBody.model = options.model;
      }
      
      console.log('Sending prompt to OpenCode...');
      
       const result = await this.#fetchApi(`/session/${session.id}/message`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        timeout: 30000  // 30秒超时，快速失败
      });
      
      console.log('OpenCode response received');
      
      if (!result.info) {
        throw new Error('Invalid response format from OpenCode');
      }
      
      if (result.info.error) {
        throw new Error(`OpenCode generation error: ${result.info.error.message}`);
      }
      
      const textResponse = this.#extractTextResponse(result);
      
      if (!textResponse) {
        throw new Error('No text response received from OpenCode');
      }
      
      const parsedResponse = this.#parseResponseText(textResponse);
      
      return {
        success: true,
        sessionId: session.id,
        files: parsedResponse.files || {},
        explanation: parsedResponse.explanation || 'Generated Vue2 project',
        rawResponse: result
      };

    } catch (error) {
      console.error('OpenCode client error:', error);
      return {
        success: false,
        error: error.message,
        files: null,
        explanation: null
      };
    }
  }

  #extractTextResponse(result) {
    if (!result.parts) {
      return null;
    }
    
    for (const part of result.parts) {
      if (part.type === 'text' && part.text) {
        return part.text;
      }
    }
    
    return null;
  }

  #parseResponseText(text) {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1].replace(/^json\n/, '');
        return JSON.parse(jsonStr);
      }
      
      const lines = text.split('\n');
      const jsonStart = lines.findIndex(line => line.trim().startsWith('{'));
      const jsonEnd = lines.findIndex(line => line.trim().endsWith('}'));
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
        const jsonStr = lines.slice(jsonStart, jsonEnd + 1).join('\n');
        return JSON.parse(jsonStr);
      }
      
      return {
        explanation: text.substring(0, 200) + '...',
        files: {}
      };
      
    } catch (error) {
      console.warn('Failed to parse OpenCode response as JSON, using raw text:', error.message);
      return {
        explanation: text.substring(0, 500) + '...',
        files: {}
      };
    }
  }

  async generateComponent(componentSpec, options = {}) {
    const prompt = this.buildComponentPrompt(componentSpec);
    return this.generateVueProject(prompt, options);
  }

  buildComponentPrompt(componentSpec) {
    const { name, description, props = [], data = [], methods = [], template, style } = componentSpec;
    
    return `
      作为Vue2专家，请生成一个完整的Vue2项目，特别关注${name}组件。

      ## 组件要求
      名称：${name}
      描述：${description}

      ## 技术规格
      1. 使用Vue2的Options API（非Composition API）
      2. Props：${JSON.stringify(props, null, 2)}
      3. Data属性：${JSON.stringify(data, null, 2)}
      4. Methods：${JSON.stringify(methods, null, 2)}
      5. 模板要求：${template || '使用简洁的HTML模板'}
      6. 样式要求：${style || '使用scoped CSS，现代简洁风格'}

      ## 项目结构要求
      请生成完整的Vue2项目，包括：
      1. package.json - 包含Vue2、Vue Router等必要依赖
      2. vue.config.js - 基本Webpack配置
      3. src/main.js - Vue应用入口
      4. src/App.vue - 根组件
      5. src/components/${name}.vue - 主组件文件
      6. src/views/ - 视图组件目录（可选）
      7. src/router/index.js - 路由配置（如果需要）
      8. public/index.html - HTML模板
      9. 其他必要的配置文件

      ## 输出格式
      请以JSON格式返回项目结构，其中键是文件路径（相对于项目根目录），值是完整的文件内容。
      将JSON包裹在\`\`\`json ... \`\`\`代码块中。
      确保所有Vue组件都使用正确的单文件组件语法（.vue文件）。
    `;
  }

  async testConnection() {
    try {
      const health = await this.#fetchApi('/global/health');
      return {
        success: true,
        version: health.version,
        healthy: health.healthy
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}