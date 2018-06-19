'use strict';

var assert = require('assert');
var vm = require('vm');
var fs = require('fs');

describe('NodeVersion loaded without global process variable', function() {
  it('returns false for all features and undefined for all versions', function(done) {
    var NoContextNodeVersion = vm.runInNewContext(
      fs.readFileSync(require.resolve('../../detail/utils/NodeVersion')),
      { global: {}, module: {} }
    );

    assert(NoContextNodeVersion.features.hasPromise === false);
    assert(NoContextNodeVersion.features.hasMicroqueuedNextTick === false);
    assert(NoContextNodeVersion.majorVersion === NoContextNodeVersion.major);
    assert(NoContextNodeVersion.minorVersion === NoContextNodeVersion.minor);
    assert(NoContextNodeVersion.patchVersion === NoContextNodeVersion.patch);

    done();
  });
});
