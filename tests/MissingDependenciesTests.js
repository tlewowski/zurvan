"use strict";
var FieldOverrider = require("../detail/FieldOverrider");

var assert = require("assert");

function dependencyTestCase(globalDependencies) {
  return function(done) {
    var overriddenZurvanCache = new FieldOverrider(require.cache, require.resolve("../zurvan"), undefined);
    var overriders = globalDependencies.map(function(dependencyName) {
      return new FieldOverrider(global, dependencyName, undefined);
    });
	
	assert.throws(function() {
	  require("../zurvan");
	}, function(err) {
	  if(!(err instanceof Error)) {
	    return false;
	  }
	  
	  return globalDependencies.map(function(dependencyName) {
	    return new RegExp("Missing dependency: " + dependencyName).test(err);
      }).reduce(function(x, y) {return x && y;}, true);
	});
	
    overriders.forEach(function(overrider) {
      overrider.restore();
    });
    overriddenZurvanCache.restore();  
	done();
  };
}

describe('zurvan', function() {
  describe('when required', function() { 
	it('throws if there is no Promise in environment', dependencyTestCase(["Promise"]));
	it('throws if there is no setImmediate in environment', dependencyTestCase(["setImmediate"]));
	it('throws if there is no Promise and setImmediate in environment', dependencyTestCase(["setImmediate", "Promise"]));
	it('throws if there is no Promise, setImmediate and clearImmediate in environment', dependencyTestCase(["setImmediate", "Promise", "clearImmediate"]));
  });
});