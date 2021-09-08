'use strict';

const util = require('util');
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

  async formatString() {
    const { ctx } = this;

    const messageTpl = 'test, i am %s, node versions: %j';
    this.logger.info(messageTpl, 'logger-sentry', process.versions);

    this.ctx.body = `[controller.capture] ${util.format('test, i am %s, node versions: %j', 'logger-sentry', process.versions)}`;
  }
}

module.exports = CaptureController;
