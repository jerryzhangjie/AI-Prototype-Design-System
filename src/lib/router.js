import url from 'url';

class Router {
  constructor() {
    this.routes = new Map();
    this.middlewares = [];
  }

  add(method, path, handler) {
    const key = `${method.toUpperCase()} ${path}`;
    this.routes.set(key, handler);
    return this;
  }

  get(path, handler) {
    return this.add('GET', path, handler);
  }

  post(path, handler) {
    return this.add('POST', path, handler);
  }

  put(path, handler) {
    return this.add('PUT', path, handler);
  }

  delete(path, handler) {
    return this.add('DELETE', path, handler);
  }

  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();
    const query = parsedUrl.query;
    
    const request = {
      method,
      url: req.url,
      pathname,
      query,
      headers: req.headers,
      body: null,
      params: {},
      originalReq: req
    };

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      originalRes: res,
      setHeader(name, value) {
        this.headers[name] = value;
      },
      json(data) {
        res.writeHead(this.statusCode, this.headers);
        res.end(JSON.stringify(data));
      },
      send(data) {
        res.writeHead(this.statusCode, this.headers);
        res.end(data);
      },
      status(code) {
        this.statusCode = code;
        return this;
      }
    };

    try {
      for (const middleware of this.middlewares) {
        const shouldContinue = await middleware(request, response);
        if (shouldContinue === false) {
          return;
        }
      }

      const routeKey = `${method} ${pathname}`;
      const handler = this.routes.get(routeKey);

      if (handler) {
        await handler(request, response);
      } else {
        response.status(404).json({
          error: 'Not Found',
          message: `Route ${method} ${pathname} not found`
        });
      }
    } catch (error) {
      console.error('Route handling error:', error);
      response.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  match(method, path) {
    const routeKey = `${method.toUpperCase()} ${path}`;
    return this.routes.get(routeKey);
  }

  getRoutes() {
    const routes = [];
    for (const [key, handler] of this.routes.entries()) {
      const [method, path] = key.split(' ');
      routes.push({ method, path, handler: handler.name || 'anonymous' });
    }
    return routes;
  }
}

export default Router;