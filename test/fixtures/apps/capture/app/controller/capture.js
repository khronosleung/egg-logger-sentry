'use strict';

const Controller = require('egg').Controller;

class CaptureController extends Controller {
  async message() {
    this.logger.info('test', {});
    this.ctx.body = 'ok';
  }

  async throw() {
    throw new Error('test');

    this.ctx.body = 'ok';
  }

  async prePostContext() {
    const { name } = this.ctx.query;

    this.ctx.sentryScope.setTag('query.name', name);

    throw new Error('test');

    this.ctx.body = 'ok';
  }

  async stacktraceOrder() {
    const { ctx } = this;

    await ctx.service.user.find(1);

    this.ctx.body = 'ok';
  }
}

module.exports = CaptureController;
