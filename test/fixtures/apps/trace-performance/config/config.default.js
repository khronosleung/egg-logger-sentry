'use strict';

exports.keys = '123456';

// 日志
exports.logger = {
  level: 'DEBUG',
  consoleLevel: 'DEBUG',
};

exports.loggerSentry = {
  dsn: 'http://12345@sentry.example.com/1',
  disableLoggers: [ 'scheduleLogger', 'errorLogger', 'coreLogger' ],
};
