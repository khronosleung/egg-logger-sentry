'use strict';

const path = require('path');
const fs = require('fs');
const is = require('@sindresorhus/is');

function loadModuleVersion(app, name = '') {
  const modulePath = path.join(app.baseDir, 'node_modules', name, 'package.json');
  if (fs.existsSync(modulePath)) {
    return require(modulePath).version;
  }
  return null;
}

let eggVersion = '';
let eggScriptsVersion = '';
let eggAliNodeVersion = '';
module.exports = (scope, ctx) => {
  const { app } = ctx;

  if (is.emptyString(eggVersion)) {
    eggVersion = loadModuleVersion(app, 'egg');
    if (!is.nullOrUndefined(eggVersion)) {
      scope.setExtra('egg', eggVersion);
    }
  }
  if (is.emptyString(eggScriptsVersion)) {
    eggScriptsVersion = loadModuleVersion(app, 'egg-scripts');
    if (!is.nullOrUndefined(eggScriptsVersion)) {
      scope.setExtra('egg-scripts', eggScriptsVersion);
    }
  }
  if (is.emptyString(eggAliNodeVersion)) {
    eggAliNodeVersion = loadModuleVersion(app, 'egg-alinode');
    if (!is.nullOrUndefined(eggAliNodeVersion)) {
      scope.setExtra('egg-alinode', eggAliNodeVersion);
    }
  }

  if (!is.nullOrUndefined(app.type)) {
    scope.setTag('app.type', app.type);
  }

  const user = scope.getUser();
  if (is.undefined(user.ip_address)) {
    scope.setUser({
      ip_address: ctx.ips.length > 0 ? ctx.ips[0] : ctx.ip,
    });
  }
};
