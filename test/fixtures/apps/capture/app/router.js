'use strict';

module.exports = app => {
  const { router, controller } = app;

  router.get('/capture/message', controller.capture.message);
  router.get('/capture/throw', controller.capture.throw);
  router.get('/capture/pre-and-post-context', controller.capture.prePostContext);
  router.get('/capture/stacktrace-order', controller.capture.stacktraceOrder);
  router.get('/capture/format-string', controller.capture.formatString);
};
