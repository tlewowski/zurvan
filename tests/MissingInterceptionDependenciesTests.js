'use strict';
var FieldOverrider = require('../detail/utils/FieldOverrider');
var zurvan = require('../zurvan');
var assert = require('assert');

function interceptionDependencyTestCase(config) {
  return function(done) {
    try {
      zurvan.interceptTimers(config);
      done(new Error('Timers should not be intercepted'));
    } catch (err) {
      done();
    }
  };
}

describe('zurvan', function() {
  describe('when timers are intercepted', function() {
    it(
      'throws if there is no Promise in config',
      interceptionDependencyTestCase({ promiseScheduler: undefined })
    );
    it(
      'throws if Promise is not a function',
      interceptionDependencyTestCase({ promiseScheduler: 2 })
    );
    it(
      'throws if Promise.then is not a function',
      interceptionDependencyTestCase({ promiseScheduler: function() {} })
    );

    var noCatchPromise = function() {};
    noCatchPromise.then = function() {};

    it(
      'throws if Promise.then is not a function',
      interceptionDependencyTestCase({ promiseScheduler: noCatchPromise })
    );
  });
});
