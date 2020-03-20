'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const message = 'hi, ' + this.app.plugins.loggerSentry.name;

    const input = {
      ...ctx.request.body,
    };

    ctx.logger.debug(message, input);

    const output = ctx.app.Sentry.getCurrentHub().getStackTop().scope;

    ctx.body = {
      input,
      output: {
        ...output,
      },
    };
  }
}

module.exports = HomeController;
