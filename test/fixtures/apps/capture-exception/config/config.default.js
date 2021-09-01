'use strict';

exports.keys = '123456';

// 日志
exports.logger = {
  level: 'ERROR',
  consoleLevel: 'ERROR',
};

exports.loggerSentry = {
  // dsn: 'https://12345@example.com/1',
  dsn: 'https://2ee6a94537834a79b897f11143d2f1f6@logger2.zuzuche.com/11',
  tracesSampleRate: 1.0,
  disable: [ 'scheduleLogger', 'errorLogger', 'coreLogger' ],
  debug: true,
};
