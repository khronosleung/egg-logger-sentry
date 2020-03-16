'use strict';

const SentrySDK = require('./lib/sentrySDK');
const SentryLoggerTransport = require('./lib/sentryLoggerTransport');

module.exports = class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  configDidLoad() {
    const { app } = this;
    app.config.coreMiddleware.unshift('sentryPushScope');
    app.config.coreMiddleware.push('sentryPopScope');
  }

  didLoad() {
    const { app } = this;

    app.Sentry = SentrySDK(app);

    const config = app.config.loggerSentry;
    for (const [ name, logger ] of app.loggers.entries()) {
      if (config.disable.includes(name)) {
        continue;
      }

      const transport = new SentryLoggerTransport({
        level: logger.options.level,
        app,
      });
      logger.set('sentry', transport);
    }
  }
};
