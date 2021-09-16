'use strict';

const assert = require('assert');
const os = require('os');

const is = require('@sindresorhus/is');
const Sentry = require('@sentry/node');
require('@sentry/tracing');

const SentryLoggerTransport = require('./sentryLoggerTransport');
const truncate = require('./utils/truncate');

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

  const spanMap = {};
  app.httpclient.on('request', req => {
    if (!isEnabledTrace) {
      return;
    }

    let span;
    let scope;
    let parentSpan;
    const { ctx, url, args } = req;

    let requestData = args.data;
    if (is.string(requestData)) {
      requestData = truncate(requestData, 250);
    }

    if (
      is.undefined(ctx)
      || is.undefined(ctx.sentryScope)
      || /\/__schedule\?path=.*/.test(ctx.originalUrl)
    ) {
      span = Sentry.startTransaction({
        name: `${args.method || 'GET'} ${url}`,
        data: !is.undefined(requestData) ? {
          'http.server.data': requestData,
        } : undefined,
        op: 'http.server',
      });
    } else {
      scope = ctx.sentryScope;
      parentSpan = scope.getSpan();

      span = parentSpan.startChild({
        description: `${args.method || 'GET'} ${url}`,
        data: !is.undefined(requestData) ? {
          'Request.data': requestData,
        } : undefined,
        op: 'request',
      });
    }

    const sentryTraceHeader = span.toTraceparent();
    if (!is.undefined(sentryTraceHeader)) {
      args.headers = { ...args.headers, 'sentry-trace': sentryTraceHeader };

      if (is.undefined(spanMap[sentryTraceHeader])) {
        spanMap[sentryTraceHeader] = span;
      }
    }
  });
  app.httpclient.on('response', result => {
    if (!isEnabledTrace) {
      return;
    }

    const { ctx, res, req } = result;

    const timingData = is.nonEmptyObject(res.timing) ? { ...res.timing } : null;

    if (!is.undefined(ctx) && !is.undefined(ctx.sentryScope)) {
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
      if (timingData) {
        breadcrumb.data.timing = timingData;
      }
      ctx.sentryScope.addBreadcrumb(breadcrumb);
    }

    let spanMapKey = '';
    if (is.object(req.args) && !is.undefined(req.args.headers['sentry-trace'])) {
      spanMapKey = req.args.headers['sentry-trace'];
    } else if (is.string(req.options.headers['sentry-trace'])) {
      spanMapKey = req.options.headers['sentry-trace'];
    }

    if (is.nonEmptyString(spanMapKey) && !is.undefined(spanMap[spanMapKey])) {
      const span = spanMap[spanMapKey];
      if (timingData) {
        span.setData('Request.timing', timingData);
      }
      if (res.statusCode) {
        span.setHttpStatus(res.statusCode);
      }
      span.finish();
      delete spanMap[spanMapKey];
    }
  });

  app.Sentry = Sentry;

  for (const [ name, logger ] of app.loggers.entries()) {
    if (
      is.array(config.disableLoggers)
      && config.disableLoggers.includes(name)
    ) {
      continue;
    }

    const transport = new SentryLoggerTransport({
      level: logger.options.level,
      loggerEntry: name,
      app,
    });
    logger.set('sentry', transport);
  }

  app.config.coreMiddleware.unshift('loggerSentry');
};
