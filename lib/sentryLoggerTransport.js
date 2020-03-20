'use strict';

const util = require('util');
const assert = require('assert');

const { Transport } = require('egg-logger');

function isObject(s) {
  return {}.toString.call(s) === '[object Object]';
}
function isString(s) {
  return {}.toString.call(s) === '[object String]';
}
function keys(s) {
  return Object.keys(s);
}

class SentryLoggerTransport extends Transport {
  log(level, args, meta) {
    let message = args[0];
    let options = args[1] || {};
    const { ctx } = meta || {};

    let convertValue = '';
    if (isString(options)) {
      convertValue = options;
      options = {};
    }

    if (
      isString(message)
      && /%[a-zA-Z]{1}/.test(message)
      && convertValue !== ''
    ) {
      message = util.format.apply(util, args);
    }


    const Sentry = this.options.app.Sentry;

    Sentry.configureScope(scope => {
      const stack = Sentry.getCurrentHub().getStack();
      const originScope = stack.length > 1 ? stack[stack.length - 2].scope : undefined;
      if (originScope) {
        originScope.clearBreadcrumbs();

        assert(originScope._breadcrumbs.length === 0, '');
      }

      if (isObject(options.extra)) {
        keys(options.extra).forEach(key => {
          scope.setExtra(key, options.extra[key]);
        });
      }

      if (isObject(options.tags)) {
        keys(options.tags).forEach(key => {
          scope.setTag(key, options.tags[key]);
        });
      }

      let userInfo = {};
      if (isObject(options.user)) {
        userInfo = {
          ...options.user,
        };
      }
      if (!userInfo.ip_address && ctx) {
        userInfo.ip_address = ctx.ips.length > 0 ? ctx.ips[0] : ctx.ip;
      }
      scope.setUser(userInfo);

      scope.setLevel(String(level).toLowerCase());
      if (ctx && ctx.request) {
        scope.addEventProcessor(event => {
          return Sentry.Handlers.parseRequest(event, ctx.request);
        });
      }

      if (level === 'ERROR') {
        Sentry.captureException(message instanceof Error ? message : new Error(message));
      } else {
        Sentry.captureMessage(message);
      }
    });
  }
}

module.exports = SentryLoggerTransport;
