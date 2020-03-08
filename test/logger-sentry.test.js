'use strict';

const mock = require('egg-mock');

describe('test/logger-sentry.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/logger-sentry-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, loggerSentry')
      .expect(200);
  });
});
