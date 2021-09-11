'use strict';

exports.keys = '123456';

// 日志
exports.logger = {
  level: 'DEBUG',
  consoleLevel: 'DEBUG',
};

exports.loggerSentry = {
  dsn: 'https://12345@sentry.example.com/1',
  tracesSampleRate: 1.0,
  disableLoggers: [ 'scheduleLogger', 'errorLogger', 'coreLogger' ],
};
