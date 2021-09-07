'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const message = 'hi, ' + this.app.plugins.loggerSentry.name;


    await ctx.curl('http://httpbin.org/get?a=1', {
      method: 'GET',
    });
    await ctx.curl('http://httpbin.org/get?a=2', {
      method: 'GET',
    });

    ctx.sentryScope.addBreadcrumb({
      type: 'default',
      category: 'log',
      data: undefined,
      message,
    });

    ctx.logger.debug(message);

    ctx.body = {
      output: {
        // ...output,
      },
    };
  }
}

module.exports = HomeController;
