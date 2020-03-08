'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

const Sentry = require('@sentry/node');


function loadModuleVersion(name = '') {
  const cwd = process.cwd();
  const modulePath = path.join(cwd, 'ode_modules', name, 'package.json');
  if (fs.existsSync(modulePath)) {
    return require(modulePath).version;
  }
  return null;
}

module.exports = function SentrySDK(app) {
  const config = this.app.config.sentry;

  if (!config.environment) {
    config.environment = app.config.env;
  }
  if (!config.serverName) {
    config.serverName = os.hostname();
  }

  Sentry.init({
    ...config,
  });

  const eggVersion = loadModuleVersion('egg');
  const eggAliNodeVersion = loadModuleVersion('egg-alinode');
  const eggScriptsVersion = loadModuleVersion('egg-scripts');

  eggVersion && Sentry.setExtra('egg', eggVersion);
  eggScriptsVersion && Sentry.setExtra('egg-scripts', eggScriptsVersion);
  eggAliNodeVersion && Sentry.setExtra('egg-alinode', eggAliNodeVersion);

  return Sentry;
};
