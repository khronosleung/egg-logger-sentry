'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    this.app.Sentry.setTag('test', '1');

    throw new Error('test');
  }
}

module.exports = HomeController;
