'use strict';

const util = require('util');

const is = require('@sindresorhus/is');

const { Transport } = require('egg-logger');
const path = require('path');
const fs = require('fs');

function keys(s) {
  return Object.keys(s);
}

function loadModuleVersion(app, name = '') {
  const modulePath = path.join(app.baseDir, 'node_modules', name, 'package.json');
  if (fs.existsSync(modulePath)) {
    return require(modulePath).version;
  }
  return null;
}

class SentryLoggerTransport extends Transport {
  log(level, args, meta) {
    let message = args[0];
    let options = args[1] || {};
    const { app } = this.options;
    let { ctx } = meta || {};

    const Sentry = app.Sentry;

    if (!is.object(ctx) || !is.object(ctx.app)) {
      ctx = app.createAnonymousContext();
      ctx.sentryScope = new Sentry.Scope();
    }

    let convertValue = '';
    if (is.string(options)) {
      convertValue = options;
      options = {};
    }

    if (
      is.string(message)
      && /%[a-zA-Z]{1}/.test(message)
      && convertValue !== ''
    ) {
      message = util.format.apply(util, args);
    }

    const scope = ctx.sentryScope;

    const eggVersion = loadModuleVersion(app, 'egg');
    const eggScriptsVersion = loadModuleVersion(app, 'egg-scripts');
    const eggAliNodeVersion = loadModuleVersion(app, 'egg-alinode');

    scope.setTag('app-type', app.type);

    if (!is.nullOrUndefined(eggVersion)) {
      scope.setExtra('egg', eggVersion);
    }
    if (!is.nullOrUndefined(eggScriptsVersion)) {
      scope.setExtra('egg-scripts', eggScriptsVersion);
    }
    if (!is.nullOrUndefined(eggAliNodeVersion)) {
      scope.setExtra('egg-alinode', eggAliNodeVersion);
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
    if (!userInfo.ip_address && ctx) {
      userInfo.ip_address = ctx.ips.length > 0 ? ctx.ips[0] : ctx.ip;
    }
    scope.setUser(userInfo);

    scope.setLevel(Sentry.Severity.fromString(level));
    if (ctx && ctx.request) {
      scope.addEventProcessor(event => {
        return Sentry.Handlers.parseRequest(event, ctx.request);
      });
    }

    if (level === 'ERROR') {
      Sentry.captureException(is.error(message) ? message : new Error(message), () => scope);
    } else {
      Sentry.captureMessage(message, () => scope);
    }
  }
}

module.exports = SentryLoggerTransport;
