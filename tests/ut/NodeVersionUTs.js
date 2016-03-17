"use strict";

var assert = require('assert');
var FieldOverrider = require("../../detail/utils/FieldOverrider");
var nodeVersionPath = "../../detail/utils/NodeVersion";

describe("NodeVersion loaded without global process variable", function() {
  var overriddenProcess; 
  var overriddenCache;
  var NodeVersion;
  
  beforeEach(function() {
    overriddenProcess = new FieldOverrider(global, 'process', undefined);
    overriddenCache = new FieldOverrider(require.cache, require.resolve(nodeVersionPath), undefined);
    NodeVersion = require(nodeVersionPath);
  });
  
  afterEach(function() {
    NodeVersion = undefined;
    overriddenCache.restore();
    overriddenProcess.restore();
  });
    
  it('returns undefined for all versions', function(done) {
    assert(NodeVersion.major === undefined);
    assert(NodeVersion.minor === undefined);
    assert(NodeVersion.patch === undefined);
    done();
  });
  
  it('returns false for all features', function(done) {
    assert(NodeVersion.features.hasPromise === false);
    assert(NodeVersion.features.hasMicroqueuedNextTick === false);
    done();
  });
});