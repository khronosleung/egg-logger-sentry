'use strict';

module.exports = class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  configDidLoad() {
    require('./lib/sentry')(this.app);
  }
};
