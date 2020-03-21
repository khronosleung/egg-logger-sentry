'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const message = 'hi, ' + this.app.plugins.loggerSentry.name;
    ctx.logger.debug(message, {
      extra: {
        abc: {
          def: [ 1 ],
        },
      },
    });
    ctx.body = message;
  }
}

module.exports = HomeController;
