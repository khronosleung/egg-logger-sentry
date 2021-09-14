'use strict';

module.exports = app => {
  const { router, controller } = app;

  router.get('/trace-performance/trace-curl', controller.home.traceCurl);
  router.get('/trace-performance/trace-app-curl', controller.home.traceAppCurl);
  router.get('/trace-performance/trace-custom', controller.home.traceCustom);
  router.get('/trace-performance/trace-parallelism-curl', controller.home.traceParallelismCurl);
};
