'use strict';

module.exports = app => {
  const { router, controller } = app;

  router.get('/logger', controller.logger.index);
};
