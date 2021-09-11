'use strict';

module.exports = app => {
  const { router, controller } = app;

  router.get('/trace-performance/trace-curl', controller.home.traceCurl);
  router.get('/trace-performance/trace-custom', controller.home.traceCustom);
};
