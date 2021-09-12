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
[travis-url]: https://app.travis-ci.com/github/kidneyleung/egg-logger-sentry
[codecov-image]: https://img.shields.io/codecov/c/github/kidneyleung/egg-logger-sentry.svg?style=flat-square
[codecov-url]: https://codecov.io/github/kidneyleung/egg-logger-sentry?branch=master
[david-image]: https://img.shields.io/david/kidneyleung/egg-logger-sentry.svg?style=flat-square
[david-url]: https://david-dm.org/kidneyleung/egg-logger-sentry
[snyk-image]: https://snyk.io/test/npm/egg-logger-sentry/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-logger-sentry
[download-image]: https://img.shields.io/npm/dm/egg-logger-sentry.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-logger-sentry

egg 框架的 sentry 插件

此插件基于 [@sentry/node](https://docs.sentry.io/platforms/node/) 进行二次封装，针对egg机制进行定制化功能开发：

* 高并发环境下，会话日志面包屑数据污染问题
* 默认接入应用请求会话和curl [Performance Monitoring](https://docs.sentry.io/product/performance/) 功能
* 适配EggJS日志API
* 适配EggJS日志分类

[Sentry 官网](https://sentry.io/)


## 安装

```bash
$ npm i egg-logger-sentry --save
```

## 开启插件

```js
// config/plugin.js
exports.loggerSentry = {
  enable: true,
  package: 'egg-logger-sentry',
};
```


## 详细配置

基于 [Sentry for Node.js Configuration](https://docs.sentry.io/platforms/node/configuration/) 扩展配置：


| 配置项           |    类型    |   默认值  |   说明   |
| --------        |  :-----:  |  :----:  |  :----  |
| disableLoggers  | `{Array<string>}` |   `[]`   | 指定日志分类不进行日志捕获，详情查看[Egg日志分类](https://eggjs.org/zh-cn/core/logger.html#%E6%97%A5%E5%BF%97%E5%88%86%E7%B1%BB) |


```javascript
// config/config.[env].js
const os = require('os');

config.loggerSentry = {
  dsn: "https://12345@sentry.example.com/1",
  environment: appInfo.env,
  serverName: os.hostname(),
  release: process.env.GIT_COMMIT_HASH || '', // git commit hash
  disableLoggers: [],
};
```

## 性能监控链路追踪

利用sentry提供的 `@sentry/tracing` 组件，对应用进行性能监控，覆盖范围可达多个服务（Nodejs、Browser、GO、Java、PHP等），获知整个应用的吞吐量、耗时等指标。

[@sentry/tracing支持开发语言SDK](https://docs.sentry.io/product/performance/getting-started/)

[Sentry Performance Monitoring文档](https://docs.sentry.io/product/performance/)


例子：
```javascript
const parentSpan = ctx.sentryScope.getSpan();

const span = parentSpan.startChild({
  description: '获取会员信息',
  op: 'service',
});

await this.ctx.curl(/* http://... */);

span.finish();
```

由NodeJS到浏览器页面跨服务追踪

NodeJS render.js
```javascript
const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const renderData = {
      sentryTrace: ctx.sentryScope.getSpan().toSentryTrace(),
    };
    await this.ctx.render('index.nj', renderData);
  }
}
```

index.nj

客户端可配合 [JavaScript SDK](https://docs.sentry.io/platforms/javascript/performance/)  使用

```html
<!doctype html>
<html lang="zh-cmn-Hans">
<head>
    <meta charset="utf-8">
    <meta name="sentry-trace" content="{{ sentryTrace }}" />
</head>
<body>

</body>
</html>
```


## 提问交流

请到 [egg-logger-sentry issues](https://github.com/kidneyleung/egg-logger-sentry/issues) 交流。

## License

[MIT](LICENSE)
