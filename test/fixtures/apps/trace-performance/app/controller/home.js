'use strict';

const sleep = require('ko-sleep');

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async traceCurl() {
    const { ctx } = this;
    const message = 'hi, ' + this.app.plugins.loggerSentry.name;

    await ctx.curl('http://httpbin.org/get?a=1', {
      method: 'GET',
      dataType: 'json',
      timing: true,
      timeout: 10000
    });
    await ctx.curl('http://httpbin.org/get?a=2', {
      method: 'GET',
      dataType: 'json',
      timing: true,
      timeout: 10000
    });

    ctx.body = {
      output: message,
    };
  }

  async traceAppCurl() {
    const { ctx, app } = this;
    const message = 'hi, ' + this.app.plugins.loggerSentry.name;

    await app.curl('http://httpbin.org/get?a=1', {
      method: 'GET',
      dataType: 'json',
      timing: true,
      timeout: 10000
    });
    await app.curl('http://httpbin.org/get?a=2', {
      method: 'GET',
      dataType: 'json',
      timing: true,
      timeout: 10000
    });

    ctx.body = {
      output: message,
    };
  }

  async traceCustom() {
    const { ctx } = this;
    const message = 'hi, ' + this.app.plugins.loggerSentry.name;

    await ctx.curl('http://httpbin.org/get?a=1', {
      method: 'GET',
    });

    const parentSpan = ctx.sentryScope.getSpan();

    const span = parentSpan.startChild({
      description: 'sleep处理耗时',
      op: 'sleep',
    });

    await sleep(500);

    span.finish();

    await ctx.curl('http://httpbin.org/get?a=2', {
      method: 'GET',
    });

    ctx.body = {
      output: message,
    };
  }

  async traceParallelismCurl() {
    const { ctx, app } = this;
    const message = 'hi, ' + app.plugins.loggerSentry.name;

    const curl1 = ctx.curl('http://httpbin.org/get?a=1', {
      method: 'GET',
      dataType: 'json',
      timing: true,
      timeout: 10000
    });
    const curl2 = ctx.curl('http://httpbin.org/get?a=2', {
      method: 'GET',
      dataType: 'json',
      timing: true,
      timeout: 10000
    });
    const result = await Promise.all([curl1, curl2]);

    ctx.body = {
      output: message,
    };
  }
}

module.exports = HomeController;
