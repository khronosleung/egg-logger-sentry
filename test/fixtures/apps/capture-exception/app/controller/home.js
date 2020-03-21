'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const message = 'hi, ' + this.app.plugins.loggerSentry.name;

    this.app.Sentry.setTag('test', '1');

    throw new Error('test');

    ctx.body = message;
  }
}

module.exports = HomeController;
