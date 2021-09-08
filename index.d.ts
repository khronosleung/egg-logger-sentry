import * as Sentry from '@sentry/node';

declare module 'egg' {
    // extend app
    interface Application {
        Sentry: typeof Sentry;
    }

    // extend context
    interface Context {
        sentryScope: Sentry.Scope;
    }

    // extend your config
    interface EggAppConfig {
        loggerSentry: Sentry.NodeOptions;
    }
}
