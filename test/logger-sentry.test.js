'use strict';

const assert = require('assert');
const mock = require('egg-mock');
const sleep = require('ko-sleep');

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
      const client = app.Sentry.getCurrentHub().getStackTop().client;
      let eventResult = {};
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      await app.httpRequest()
        .post('/')
        .send({
          extra: {
            abc: {
              def: [ 1 ],
            },
          },
        })
        .expect(200);

      await sleep(500);

      assert.deepEqual(eventResult.extra, {
        abc: {
          def: [ 1 ],
        },
        node: process.version,
      });
    });

    it('set/get tags', async () => {
      const client = app.Sentry.getCurrentHub().getStackTop().client;
      let eventResult = {};
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      await app.httpRequest()
        .post('/')
        .send({
          tags: {
            abc: 'def',
          },
        })
        .expect(200);

      await sleep(500);

      assert.deepEqual(eventResult.tags, {
        abc: 'def',
      });
    });

    it('set/get user', async () => {
      const client = app.Sentry.getCurrentHub().getStackTop().client;
      let eventResult = {};
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      await app.httpRequest()
        .post('/')
        .send({
          user: {
            id: 1234,
          },
        })
        .expect(200);

      await sleep(500);

      assert.deepEqual(eventResult.user, {
        id: 1234,
        ip_address: '127.0.0.1',
      });
    });
  });

  describe('breadcrumbs', () => {
    let app;
    before(() => {
      app = mock.app({
        baseDir: 'apps/breadcrumbs',
      });
      return app.ready();
    });
    after(() => app.close());

    it('record auto breadcrumbs', async () => {
      const client = app.Sentry.getCurrentHub().getStackTop().client;
      let eventResult = {};
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      await app.httpRequest()
        .get('/')
        .expect(200);

      await sleep(500);

      assert(eventResult.breadcrumbs.length === 3);
    });
  });

  describe('capture', () => {
    it('capture an exception', async () => {
      const app = mock.app({
        baseDir: 'apps/capture-exception',
      });
      await app.ready();

      const client = app.Sentry.getCurrentHub().getStackTop().client;
      let eventResult = {};
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      await app.httpRequest()
        .get('/')
        .expect(500);

      await sleep(500);

      assert.deepEqual(eventResult.tags, { test: '1' });
      assert(eventResult.exception !== undefined);
      assert(eventResult.exception.values[0] !== undefined);
      assert(eventResult.exception.values[0].stacktrace !== undefined);
      assert(eventResult.exception.values[0].stacktrace.frames !== undefined);

      await app.close();
    });

    it('capture an exception no pre/post context', async () => {
      const app = mock.app({
        baseDir: 'apps/capture-exception',
      });
      await app.ready();

      const client = app.Sentry.getCurrentHub().getStackTop().client;
      let eventResult = {};
      client._options.frameContextLines = false;
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      await app.httpRequest()
        .get('/')
        .expect(500);

      await sleep(500);

      assert.deepEqual(eventResult.tags, { test: '1' });
      assert(eventResult.exception !== undefined);
      assert(eventResult.exception.values[0] !== undefined);
      assert(eventResult.exception.values[0].type === 'Error');
      assert(eventResult.exception.values[0].value === 'test');
      assert(eventResult.exception.values[0].stacktrace !== undefined);
      assert(eventResult.exception.values[0].stacktrace.frames !== undefined);
      assert(eventResult.exception.values[0].stacktrace.frames[0].pre_context === undefined);
      assert(eventResult.exception.values[0].stacktrace.frames[0].post_context === undefined);

      await app.close();
    });

    it('capture a message', async () => {
      const app = mock.app({
        baseDir: 'apps/capture-message',
      });
      await app.ready();

      const client = app.Sentry.getCurrentHub().getStackTop().client;
      let eventResult = {};
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      await app.httpRequest()
        .get('/')
        .expect(200);

      await sleep(500);

      assert(eventResult.message === 'test');
      assert(eventResult.exception === undefined);

      await app.close();
    });

    it('stacktrace order', async () => {
      const app = mock.app({
        baseDir: 'apps/capture-exception-stacktrace',
      });
      await app.ready();

      const client = app.Sentry.getCurrentHub().getStackTop().client;
      let eventResult = {};
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      await app.httpRequest()
        .get('/')
        .expect(500);

      await sleep(500);

      assert(
        eventResult.exception.values[0].stacktrace.frames[
          eventResult.exception.values[0].stacktrace.frames.length - 1
        ].function === 'UserService.find');

      await app.close();
    });
  });
});
