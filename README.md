# egg-logger-sentry

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-logger-sentry.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-logger-sentry
[travis-image]: https://img.shields.io/travis/kidneyleung/egg-logger-sentry.svg?style=flat-square
[travis-url]: https://travis-ci.com/kidneyleung/egg-logger-sentry
[codecov-image]: https://img.shields.io/codecov/c/github/kidneyleung/egg-logger-sentry.svg?style=flat-square
[codecov-url]: https://codecov.io/github/kidneyleung/egg-logger-sentry?branch=master
[david-image]: https://img.shields.io/david/kidneyleung/egg-logger-sentry.svg?style=flat-square
[david-url]: https://david-dm.org/kidneyleung/egg-logger-sentry
[snyk-image]: https://snyk.io/test/npm/egg-logger-sentry/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-logger-sentry
[download-image]: https://img.shields.io/npm/dm/egg-logger-sentry.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-logger-sentry

Sentry SDK for Egg

## Install

```bash
$ npm i egg-logger-sentry --save
```

## Configuration

Change `${app_root}/config/plugin.js` to enable `egg-logger-sentry` plugin:

```js
exports.loggerSentry = {
  enable: true,
  package: 'egg-logger-sentry',
};
```

Configure information in `${app_root}/config/config.default.js`:

```js
exports.loggerSentry = {
  dsn: 'https://<hash>@example.com/<id>'
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Usage

### 

```js
ctx.logger.debug('debug info');
ctx.logger.info('some request data: %j', ctx.request.body);
ctx.logger.warn('WARNNING!!!!');
```



## Questions & Suggestions

Please open an issue [here](https://github.com/kidneyleung/egg-logger-sentry/issues).

## License

[MIT](LICENSE)
