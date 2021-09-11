'use strict';

const util = require('util');
const is = require('@sindresorhus/is');
const fillScopeBaseProps = require('./fillScopeBaseProps');

const { Transport } = require('egg-logger');

function keys(s) {
  return Object.keys(s);
}

// see: http://nodejs.cn/api/util.html#util_util_format_format_args
const REG_FORMAT_STRING = /%[sdifjoOc%]{1}/;

class SentryLoggerTransport extends Transport {
  log(level, args, meta) {
    let message = args[0];
    let options = args[1] || {};
    const { app, loggerEntry } = this.options;
    let { ctx } = meta || {};

    const Sentry = app.Sentry;

    if (!is.object(ctx) || !is.object(ctx.app)) {
      ctx = app.createAnonymousContext();
      ctx.sentryScope = new Sentry.Scope();
    }
    const scope = ctx.sentryScope;

    const isFormatString = is.string(message) && REG_FORMAT_STRING.test(message);

    if (isFormatString && !is.nullOrUndefined(options)) {
      options = {};
      message = util.format.apply(util, args);
    }

    fillScopeBaseProps(scope, ctx);

    if (!is.nullOrUndefined(loggerEntry)) {
      scope.setTag('logger.entry', loggerEntry);
    }

    if (is.object(options.extra)) {
      keys(options.extra).forEach(key => {
        scope.setExtra(key, options.extra[key]);
      });
    }

    if (is.object(options.tags)) {
      keys(options.tags).forEach(key => {
        scope.setTag(key, options.tags[key]);
      });
    }

    let userInfo = {};
    if (is.object(options.user)) {
      userInfo = {
        ...options.user,
      };
    }
    if (is.undefined(userInfo.ip_address) && ctx) {
      userInfo.ip_address = ctx.ips.length > 0 ? ctx.ips[0] : ctx.ip;
    }
    scope.setUser(userInfo);

    scope.setLevel(Sentry.Severity.fromString(level));
    if (ctx && ctx.request) {
      scope.addEventProcessor(event => {
        return Sentry.Handlers.parseRequest(event, ctx.request);
      });
    }

    if (level.toLowerCase() === Sentry.Severity.Error.toLowerCase()) {
      Sentry.captureException(is.error(message) ? message : new Error(message), () => scope);
    } else {
      Sentry.captureMessage(message, () => scope);
    }
  }
}

module.exports = SentryLoggerTransport;
