'use strict';

const assert = require('assert');
const mock = require('egg-mock');
const sleep = require('ko-sleep');
const nock = require('nock');


function truncate(str, max = 0) {
  if (typeof str !== 'string' || max === 0) {
    return str;
  }
  return str.length <= max ? str : `${str.substr(0, max)}...`;
}

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

      const client = app.Sentry.getCurrentHub().getClient();
      const config = client.getOptions();

      assert.strictEqual(typeof config.dsn, 'string');
      assert.strictEqual(typeof config.environment, 'string');
      assert.strictEqual(typeof config.serverName, 'string');
      assert.strictEqual(typeof config.debug, 'boolean');

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
      let eventResult = {};

      const client = app.Sentry.getCurrentHub().getClient();
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

      assert.deepStrictEqual(eventResult.extra, {
        abc: {
          def: [ 1 ],
        },
      });
    });

    it('set/get tags', async () => {
      let eventResult = {};

      const client = app.Sentry.getCurrentHub().getClient();
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
        transaction: 'POST /',
        'app.type': 'application',
        'logger.entry': 'logger',
        abc: 'def',
      });
    });

    it('set/get user', async () => {
      const client = app.Sentry.getCurrentHub().getClient();
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
    afterEach(mock.restore);

    it('record auto breadcrumbs', async () => {
      let eventResult = {};

      const client = app.Sentry.getCurrentHub().getClient();
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      app.mockHttpclient('http://httpbin.org/get?a=1', {
        data: 'mock response a = 1',
      });
      app.mockHttpclient('http://httpbin.org/get?a=2', {
        data: 'mock response a = 2',
      });

      await app.httpRequest()
        .get('/')
        .expect(200);

      await sleep(500);

      assert(eventResult.breadcrumbs.length === 3);
    });
  });

  describe('capture', () => {
    let app;

    before(() => {
      app = mock.app({
        baseDir: 'apps/capture',
      });
      return app.ready();
    });
    after(() => app.close());

    afterEach(mock.restore);

    it('capture an exception', async () => {
      let eventResult = {};

      const client = app.Sentry.getCurrentHub().getClient();
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      const result = await app.httpRequest()
        .get('/capture/throw');

      assert.deepEqual(result.status, 404);

      await sleep(500);

      assert.notStrictEqual(eventResult.exception, undefined);
      assert.notStrictEqual(eventResult.exception.values[0], undefined);
      assert.notStrictEqual(eventResult.exception.values[0].stacktrace, undefined);
      assert.notStrictEqual(eventResult.exception.values[0].stacktrace.frames, undefined);
    });

    it('capture an exception no pre/post context', async () => {
      let eventResult = {};

      const client = app.Sentry.getCurrentHub().getClient();
      client._options.frameContextLines = 0;
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      const result = await app.httpRequest()
        .get('/capture/pre-and-post-context?name=abc');

      assert.deepEqual(result.status, 404);

      await sleep(500);

      assert.notStrictEqual(eventResult.tags['query.name'], undefined);
      assert.strictEqual(eventResult.tags['query.name'], 'abc');
      assert.notStrictEqual(eventResult.exception, undefined);
      assert.notStrictEqual(eventResult.exception.values[0], undefined);
      assert.strictEqual(eventResult.exception.values[0].type, 'Error');
      assert.strictEqual(eventResult.exception.values[0].value, 'test');
      assert.notStrictEqual(eventResult.exception.values[0].stacktrace, undefined);
      assert.notStrictEqual(eventResult.exception.values[0].stacktrace.frames, undefined);
      assert.strictEqual(eventResult.exception.values[0].stacktrace.frames[0].pre_context, undefined);
      assert.strictEqual(eventResult.exception.values[0].stacktrace.frames[0].post_context, undefined);
    });

    it('capture a message', async () => {
      let eventResult = {};

      const client = app.Sentry.getCurrentHub().getClient();
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      await app.httpRequest()
        .get('/capture/message')
        .expect(200);

      await sleep(500);

      assert.match(eventResult.message, /test/);
      assert.strictEqual(eventResult.exception, undefined);
    });

    it('stacktrace order', async () => {
      let eventResult = {};

      const client = app.Sentry.getCurrentHub().getClient();
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      const result = await app.httpRequest()
        .get('/capture/stacktrace-order');

      assert.deepEqual(result.status, 404);

      await sleep(500);

      assert.deepEqual(
        eventResult.exception.values[0].stacktrace.frames[
          eventResult.exception.values[0].stacktrace.frames.length - 1
        ].function, 'UserService.find');
    });

    it('message format string', async () => {
      let eventResult = {};

      const client = app.Sentry.getCurrentHub().getClient();
      client._options.beforeSend = event => {
        eventResult = { ...event };
        return null;
      };

      const result = await app.httpRequest()
        .get('/capture/format-string');

      assert.deepEqual(result.status, 200);

      await sleep(500);

      assert.deepEqual(
        eventResult.message,
        truncate(result.text, 250)
      );
    });
  });


  describe('trace-performance', () => {
    let app;

    before(() => {
      app = mock.app({
        baseDir: 'apps/trace-performance',
      });
      return app.ready();
    });
    after(() => app.close());

    afterEach(mock.restore);

    it('trace-curl', async () => {
      nock.disableNetConnect();
      nock.enableNetConnect(host => {
        return host.includes('127.0.0.1');
      });

      let eventResult = {};
      const sentryNockInstance = nock('http://sentry.example.com');
      sentryNockInstance
        .filteringRequestBody(body => {
          const content = body.split('\n');
          eventResult = {
            envelopeHeaders: JSON.parse(content[0]),
            itemHeaders: JSON.parse(content[1]),
            reqBody: JSON.parse(content[2]),
          };
          return body;
        })
        .post(/\/api\/1\/.*/, /.*/)
        .reply(200, 'ok');

      const httpBinNockInstance = nock('http://httpbin.org');
      httpBinNockInstance.get('/get?a=1')
        .delay(300)
        .reply(200, { message: 'mock response a = 1' });
      httpBinNockInstance.get('/get?a=2')
        .delay(200)
        .reply(200, { message: 'mock response a = 2' });

      const result = await app.httpRequest()
        .get('/trace-performance/trace-curl');

      assert.deepEqual(result.status, 200);

      await sleep(1000);

      assert.deepEqual(eventResult.reqBody.transaction, 'GET /trace-performance/trace-curl');
      assert.deepEqual(eventResult.reqBody.tags.transaction, 'GET /trace-performance/trace-curl');
      assert.deepEqual(eventResult.reqBody.contexts.trace.op, 'http.server');
      assert.deepEqual(eventResult.reqBody.spans.length, 2);
      assert.deepEqual(eventResult.reqBody.spans[0].op, 'request');
      assert.deepEqual(eventResult.reqBody.spans[1].op, 'request');
      assert.deepEqual(eventResult.reqBody.breadcrumbs.length, 2);
      assert.deepEqual(eventResult.reqBody.breadcrumbs[0].type, 'http');
      assert.deepEqual(eventResult.reqBody.breadcrumbs[1].type, 'http');
      assert.deepEqual(eventResult.reqBody.user, {
        ip_address: '127.0.0.1'
      });

      nock.cleanAll();
    });

    it('log-trace', async () => {
      nock.disableNetConnect();
      nock.enableNetConnect(host => {
        return host.includes('127.0.0.1');
      });

      let eventResult = {};
      const sentryNockInstance = nock('http://sentry.example.com');
      sentryNockInstance
        .filteringRequestBody(body => {
          const content = body.split('\n');
          eventResult = {
            envelopeHeaders: JSON.parse(content[0]),
            itemHeaders: JSON.parse(content[1]),
            reqBody: JSON.parse(content[2]),
          };
          return body;
        })
        .post(/\/api\/1\/.*/, /.*/)
        .reply(200, 'ok');

      const httpBinNockInstance = nock('http://httpbin.org');
      httpBinNockInstance.get('/get?a=1')
        .delay(300)
        .reply(200, { message: 'mock response a = 1' });
      httpBinNockInstance.get('/get?a=2')
        .delay(200)
        .reply(200, { message: 'mock response a = 2' });

      const result = await app.httpRequest()
        .get('/trace-performance/trace-custom');

      assert.deepEqual(result.status, 200);

      await sleep(1000);

      assert.deepEqual(eventResult.reqBody.transaction, 'GET /trace-performance/trace-custom');
      assert.deepEqual(eventResult.reqBody.tags.transaction, 'GET /trace-performance/trace-custom');
      assert.deepEqual(eventResult.reqBody.contexts.trace.op, 'http.server');
      assert.deepEqual(eventResult.reqBody.spans.length, 3);
      assert.deepEqual(eventResult.reqBody.spans[0].op, 'request');
      assert.deepEqual(eventResult.reqBody.spans[1].op, 'sleep');
      assert.deepEqual(eventResult.reqBody.spans[2].op, 'request');
      assert.deepEqual(eventResult.reqBody.breadcrumbs.length, 2);
      assert.deepEqual(eventResult.reqBody.breadcrumbs[0].type, 'http');
      assert.deepEqual(eventResult.reqBody.breadcrumbs[1].type, 'http');
      assert.deepEqual(eventResult.reqBody.user, {
        ip_address: '127.0.0.1'
      });

      nock.cleanAll();
    });
  });
});
