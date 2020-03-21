'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const message = 'hi, ' + this.app.plugins.loggerSentry.name;
    ctx.logger.debug('test');
    ctx.body = message;
  }
}

module.exports = HomeController;
