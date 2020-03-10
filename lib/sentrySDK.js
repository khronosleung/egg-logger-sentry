'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

const Sentry = require('@sentry/node');


function loadModuleVersion(app, name = '') {
  const modulePath = path.join(app.baseDir, 'ode_modules', name, 'package.json');
  if (fs.existsSync(modulePath)) {
    return require(modulePath).version;
  }
  return null;
}

module.exports = function SentrySDK(app) {
  const config = app.config.sentry || app.config.loggerSentry;

  assert(config.dsn, '[egg-logger-sentry] Must be set `dsn` in config');

  if (!config.environment) {
    config.environment = app.config.env;
  }
  if (!config.serverName) {
    config.serverName = os.hostname();
  }

  Sentry.init({
    ...config,
  });

  const eggVersion = loadModuleVersion(app, 'egg');
  const eggAliNodeVersion = loadModuleVersion(app, 'egg-alinode');
  const eggScriptsVersion = loadModuleVersion(app, 'egg-scripts');

  eggVersion && Sentry.setExtra('egg', eggVersion);
  eggScriptsVersion && Sentry.setExtra('egg-scripts', eggScriptsVersion);
  eggAliNodeVersion && Sentry.setExtra('egg-alinode', eggAliNodeVersion);

  return Sentry;
};
