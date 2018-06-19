'use strict';
var FieldOverrider = require('../detail/utils/FieldOverrider');

var assert = require('assert');

function startupDependencyTestCase(globalDependencies, fakeObjects) {
  return function(done) {
    var overriddenZurvanCache = new FieldOverrider(
      require.cache,
      require.resolve('../zurvan'),
      undefined
    );
    var overriders = globalDependencies.map(function(dependency) {
      return new FieldOverrider(global, dependency.name, dependency.fake);
    });

    assert.throws(
      function() {
        require('../zurvan');
      },
      function(err) {
        if (!(err instanceof Error)) {
          return false;
        }

        return globalDependencies
          .map(function(dependency) {
            return new RegExp('Missing dependency: ' + dependency.name).test(
              err
            );
          })
          .reduce(function(x, y) {
            return x && y;
          }, true);
      }
    );

    overriders.forEach(function(overrider) {
      overrider.restore();
    });

    overriddenZurvanCache.restore();
    done();
  };
}

describe('zurvan', function() {
  describe('when required', function() {
    it(
      'throws if there is no setImmediate in environment',
      startupDependencyTestCase([{ name: 'setImmediate' }])
    );
    it(
      'throws if there is no setImmediate and clearImmediate in environment',
      startupDependencyTestCase([
        { name: 'setImmediate' },
        { name: 'clearImmediate' }
      ])
    );
  });
});
