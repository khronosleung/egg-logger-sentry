/**
 * 面包屑清除
 * 此中间件作用于把无用得面包屑清空，避免带到下一个处理请求
 */

'use strict';

module.exports = () => {
  return async function sentry(ctx, next) {
    await next();

    if (ctx.app.Sentry) {
      const stack = ctx.app.Sentry.getCurrentHub().getStackTop();
      if (stack.scope) {
        stack.scope.clearBreadcrumbs();
      }
    }
  };
};
