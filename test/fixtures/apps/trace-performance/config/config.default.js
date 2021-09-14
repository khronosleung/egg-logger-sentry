'use strict';

exports.keys = '123456';

// 日志
exports.logger = {
  level: 'DEBUG',
  consoleLevel: 'DEBUG',
};

// exports.httpclient = {
//   request: {
//     enableProxy: true,
//     rejectUnauthorized: false,
//     proxy: 'http://127.0.0.1:8888',
//   },
// };

exports.loggerSentry = {
  dsn: 'http://12345@sentry.example.com/1',
  // dsn: 'http://2ee6a94537834a79b897f11143d2f1f6@logger2.zuzuche.com/11',
  // httpProxy: 'http://127.0.0.1:8888',
  disableLoggers: [ 'scheduleLogger', 'errorLogger', 'coreLogger' ],
};
