'use strict';

exports.keys = '123456';

// 日志
exports.logger = {
  level: 'ERROR',
  consoleLevel: 'ERROR',
};

exports.loggerSentry = {
  dsn: 'https://12345@example.com/1',
  disable: [ 'scheduleLogger', 'errorLogger', 'coreLogger' ],
};
