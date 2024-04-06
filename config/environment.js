'use strict';

module.exports = function (environment) {
  const mirage = process.env.mirage === 'false' ? false : true;
  console.log({
    process: process.env.mirage,
    mirage,
  });

  const ENV = {
    modulePrefix: 'gen-con-buddy',
    environment,
    rootURL: '/',
    locationType: 'history',
    'ember-local-storage': {
      namespace: 'gcb',
    },
    EmberENV: {
      EXTEND_PROTOTYPES: false,
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
      },
    },

    APP: {
      API_URL: mirage
        ? ''
        : 'https://pacific-plains-10689-8ac0e606559a.herokuapp.com',
    },
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
    ENV['ember-cli-mirage'] = {
      enabled: mirage,
    };
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    ENV['ember-cli-mirage'] = {
      enabled: mirage,
    };
  }

  return ENV;
};
