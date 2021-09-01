'use strict';

const os = require('os');

const is = require('@sindresorhus/is');
const Sentry = require('@sentry/node');
require('@sentry/tracing');

const SentryLoggerTransport = require('./sentryLoggerTransport');

module.exports = app => {
  const config = { ...app.config.loggerSentry };

  if (is.nullOrUndefined(config.environment)) {
    config.environment = app.config.env;
  }
  if (is.nullOrUndefined(config.serverName)) {
    config.serverName = os.hostname();
  }
  if (is.undefined(config.tracesSampleRate)) {
    config.tracesSampleRate = 1;
  }

  Sentry.init({
    integrations: integrations => {
      const newIntegrations = integrations.filter(integration => {
        return integration.name !== 'Console' && integration.name !== 'Http';
      });

      newIntegrations.push(new Sentry.Integrations.Http({
        breadcrumbs: false,
        tracing: true,
      }));

      return newIntegrations;
    },
    ...config,
  });

  app.httpclient.on('response', result => {
    const { ctx, res, req } = result;

    const breadcrumb = {
      category: 'http',
      data: {
        method: req.options.method,
        status_code: res && res.statusCode,
        reason: res && res.statusMessage,
        url: req.url,
      },
      type: 'http',
    };

    if (res.timing) {
      breadcrumb.data.timing = res.timing;
    }

    ctx.sentry.addBreadcrumb(breadcrumb);
  });

  app.Sentry = Sentry;

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

  app.config.coreMiddleware.unshift('loggerSentry');
};
