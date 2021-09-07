'use strict';

const assert = require('assert');
const os = require('os');

const is = require('@sindresorhus/is');
const Sentry = require('@sentry/node');
require('@sentry/tracing');

const SentryLoggerTransport = require('./sentryLoggerTransport');

module.exports = app => {
  const config = { ...app.config.loggerSentry };

  if (is.undefined(config.dsn) || is.emptyString(config.dsn)) {
    assert(config.dsn, '[egg-logger-sentry] Must be set `dsn` in config');
  }

  if (is.nullOrUndefined(config.environment)) {
    config.environment = app.config.env;
  }
  if (is.nullOrUndefined(config.serverName)) {
    config.serverName = os.hostname();
  }
  if (is.undefined(config.tracesSampleRate)) {
    config.tracesSampleRate = 1;
  } else {
    config.tracesSampleRate = parseFloat(config.tracesSampleRate);
  }

  Sentry.init({
    integrations: integrations => {
      return integrations.filter(integration => {
        return integration.name !== 'Console' && integration.name !== 'Http';
      });
    },
    ...config,
  });

  const isEnabledTrace = config.tracesSampleRate > 0 || (!is.undefined(config.tracesSampler) && config.tracesSampler() > 0);

  let span;
  app.httpclient.on('request', req => {
    if (!isEnabledTrace) {
      return;
    }

    const { ctx, url, args } = req;

    const parentSpan = ctx.sentryScope.getSpan();

    span = parentSpan.startChild({
      description: `${args.method || 'GET'} ${url}`,
      op: 'request',
    });

    const sentryTraceHeader = span.toTraceparent();

    args.headers = { ...args.headers, 'sentry-trace': sentryTraceHeader };
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
    ctx.sentryScope.addBreadcrumb(breadcrumb);

    if (span) {
      if (res.statusCode) {
        span.setHttpStatus(res.statusCode);
      }
      span.finish();
    }
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
