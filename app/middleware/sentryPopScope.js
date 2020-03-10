'use strict';

const assert = require('assert');

module.exports = () => {
  return async function sentryPopScope(ctx, next) {
    await next();

    if (ctx.app.Sentry) {
      const sentryHub = ctx.app.Sentry.getCurrentHub();
      const stack = sentryHub.getStackTop();
      if (stack.scope) {
        stack.scope.clear();
      }

      assert(
        (
          stack.scope._breadcrumbs.length === 0
          && stack.scope._level === undefined
          && stack.scope._fingerprint === undefined
        ),
        `sentry clear stack scope success: ${JSON.stringify(stack.scope)}`
      );

      sentryHub.popScope();

      assert(
        (
          sentryHub.getStack
          && sentryHub.getStack().length < 2
        ),
        `sentry popScope success: ${sentryHub.getStack().length}`
      );
    }
  };
};
