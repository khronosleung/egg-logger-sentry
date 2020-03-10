'use strict';

const assert = require('assert');

const { Transport } = require('egg-logger');

function isObject(s) {
  return {}.toString.call(s) === '[object Object]';
}

class SentryLoggerTransport extends Transport {
  log(level, args, meta) {
    let message = args[0];
    const options = args[1] || {};
    const ctx = meta && meta.ctx;

    if (!ctx) {
      return;
    }

    const Sentry = ctx.app.Sentry;

    Sentry.configureScope(scope => {
      const stack = Sentry.getCurrentHub().getStack();
      const originScope = stack.length > 1 ? stack[stack.length - 2].scope : undefined;
      if (originScope) {
        originScope.clearBreadcrumbs();

        assert(originScope._breadcrumbs.length === 0, '');
      }

      if (isObject(options.extras)) {
        Object.keys(options.extras).forEach(key => {
          scope.setExtra(key, options.extras[key]);
        });
      }

      if (isObject(options.tags)) {
        Object.keys(options.tags).forEach(tagKey => {
          scope.setTag(tagKey, options.tags[tagKey]);
        });
      }

      scope.setLevel(level.toLowerCase());
      scope.addEventProcessor(event => {
        return Sentry.Handlers.parseRequest(event, ctx.request);
      });

      if (level === 'ERROR') {
        message = message instanceof Error ? message : new Error(message);
        Sentry.captureException(message);
      } else {
        Sentry.captureMessage(message);
      }
    });
  }
}

module.exports = SentryLoggerTransport;
