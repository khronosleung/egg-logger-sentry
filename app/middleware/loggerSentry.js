'use strict';

const {
  extractTraceparentData,
  Span,
  stripUrlQueryAndFragment,
} = require('@sentry/tracing');

module.exports = () => {
  return async function loggerSentryMiddleware(ctx, next) {
    const { Sentry } = ctx.app;

    let traceparentData;
    if (ctx.get('sentry-trace')) {
      traceparentData = extractTraceparentData(ctx.get('sentry-trace'));
    }

    const reqMethod = (ctx.method || '').toUpperCase();
    const reqUrl = ctx.url && stripUrlQueryAndFragment(ctx.url);

    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: `${reqMethod} ${reqUrl}`,
      ...traceparentData,
    });

    const scope = new Sentry.Scope();
    ctx.sentryScope = scope;

    scope.setSpan(transaction);

    try {
      await next();
    } catch (error) {
      ctx.logger.error(error);
    } finally {
      ctx.res.once('finish', () => {
        setImmediate(() => {
          // if using koa router, a nicer way to capture transaction using the matched route
          if (ctx._matchedRoute) {
            const mountPath = ctx.mountPath || '';
            transaction.setName(`${reqMethod} ${mountPath}${ctx._matchedRoute}`);
          }
          transaction.setHttpStatus(ctx.status);
          transaction.finish();
        });
      });
    }
  };
};
