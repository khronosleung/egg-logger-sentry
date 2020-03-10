'use strict';

const assert = require('assert');

module.exports = () => {
  return async function sentryPushScope(ctx, next) {
    if (ctx.app.Sentry) {
      const sentryHub = ctx.app.Sentry.getCurrentHub();
      sentryHub.pushScope();

      assert(
        (
          sentryHub.getStack
          && sentryHub.getStack().length > 1
        ),
        `sentry pushScope success: ${sentryHub.getStack().length}`
      );
    }
    await next();
  };
};
