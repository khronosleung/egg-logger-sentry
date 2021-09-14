'use strict';

const Controller = require('egg').Controller;

class LoggerController extends Controller {
  async index() {
    this.ctx.logger.info('logger');
    this.ctx.coreLogger.info('coreLogger');
    this.ctx.body = 'ok';
  }
}

module.exports = LoggerController;
