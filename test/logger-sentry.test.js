'use strict';

// const os = require('os');
const assert = require('assert');
const mock = require('egg-mock');
const sleep = require('ko-sleep');

// const hostname = os.hostname();

describe('test/logger-sentry.test.js', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('sentry config', () => {
    it('empty config', async () => {
      const app = mock.app({
        baseDir: 'apps/miss-config',
      });

      try {
        await app.ready();
        throw new Error('app.ready');
      } catch (e) {
        assert(e.message === '[egg-logger-sentry] Must be set `dsn` in config');
      } finally {
        await app.close();
      }
    });

    it('should be config correctly', async () => {
      const app = mock.app({
        baseDir: 'apps/correctly-config',
      });

      await app.ready();
      const stack = app.Sentry.getCurrentHub().getStackTop();
      const config = stack.client.getOptions();

      assert(typeof config.dsn === 'string');
      assert(typeof config.environment === 'string');
      assert(typeof config.serverName === 'string');
      assert(typeof config.debug === 'boolean');

      await app.close();
    });
  });

  describe('getContext() / setContext()', () => {
    let app;
    before(() => {
      app = mock.app({
        baseDir: 'apps/context',
      });
      return app.ready();
    });
    beforeEach(() => app.mockCsrf());
    after(() => app.close());

    it('set/get extra', async () => {
      await app.httpRequest()
        .post('/')
        .send({
          extra: {
            abc: {
              def: [ 1 ],
            },
          },
        })
        .expect(res => {
          assert.deepEqual(res.body.output._extra, {
            abc: {
              def: [ 1 ],
            },
          });
        })
        .expect(200);
    });

    it('set/get tags', async () => {
      await app.httpRequest()
        .post('/')
        .send({
          tags: {
            abc: 'def',
          },
        })
        .expect(res => {
          assert.deepEqual(res.body.output._tags, {
            abc: 'def',
          });
        })
        .expect(200);
    });

    it('set/get user', async () => {
      await app.httpRequest()
        .post('/')
        .send({
          user: {
            id: 1234,
          },
        })
        .expect(res => {
          assert.deepEqual(res.body.output._user, {
            id: 1234,
            ip_address: '127.0.0.1',
          });
        })
        .expect(200);
    });
  });
});
