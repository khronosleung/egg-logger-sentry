'use strict';

const {
  extractTraceparentData,
  stripUrlQueryAndFragment,
} = require('@sentry/tracing');

const fillScopeBaseProps = require('../../lib/fillScopeBaseProps');

module.exports = () => {
  return async function loggerSentryMiddleware(ctx, next) {
    const { Sentry } = ctx.app;

    const sentryTraceHeaderName = 'sentry-trace';

    let traceParentData;
    if (ctx.get(sentryTraceHeaderName)) {
      traceParentData = extractTraceparentData(ctx.get(sentryTraceHeaderName));
    }

    const scope = new Sentry.Scope();
    fillScopeBaseProps(scope, ctx);
    ctx.sentryScope = scope;

    const reqMethod = (ctx.method || '').toUpperCase();
    const reqUrl = ctx.url && stripUrlQueryAndFragment(ctx.url);

    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: `${reqMethod} ${reqUrl}`,
      ...traceParentData,
    });

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

          // sync to sentry top scope
          const currentStackTop = Sentry.getCurrentHub().getStackTop();
          currentStackTop.scope = Sentry.Scope.clone(scope);
          transaction.finish();
        });
      });
    }
  };
};
