'use strict';

const SentrySDK = require('./lib/sentrySDK');
const SentryLoggerTransport = require('./lib/sentryLoggerTransport');

module.exports = class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  configDidLoad() {
    this.app.config.coreMiddleware.push('sentryClearBreadcrumbs');
  }

  didLoad() {
    const { app } = this;

    app.Sentry = SentrySDK(app);

    const config = app.config.sentry;
    for (const [ name, logger ] of app.loggers.entries()) {
      if (config.disable.includes(name)) {
        continue;
      }

      const transport = new SentryLoggerTransport({
        level: logger.options.level,
        app: this,
      });
      logger.set('sentry', transport);
    }
  }
};
