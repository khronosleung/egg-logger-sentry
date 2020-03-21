'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const message = 'hi, ' + this.app.plugins.loggerSentry.name;

    console.log('console.log1');
    console.log('console.log2');

    ctx.logger.debug(message);

    // const output = ctx.app.Sentry.getCurrentHub().getStackTop().scope;

    ctx.app.Sentry.addBreadcrumb({ message });

    ctx.body = {
      output: {
        // ...output,
      },
    };
  }
}

module.exports = HomeController;
