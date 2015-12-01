"use strict";
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");
var bluebird = require("bluebird");
var assert = require("assert");

var bluebirdCompatibilityTestcase = function(configuration, expectedOutput) {
  return function(done) {
    var originalSetImmediate = global.setImmediate;
    var called = 0;

    zurvan.interceptTimers(configuration).then(function() {
	  assert.notStrictEqual(originalSetImmediate, setImmediate);
  	  assert.strictEqual(originalSetImmediate.call, setImmediate.call);
	  assert.strictEqual(originalSetImmediate.bind, setImmediate.bind);
	  assert.strictEqual(originalSetImmediate.apply, setImmediate.apply);
    }).then(function() {
	  new bluebird(function(resolve) {
	    resolve();
      }).then(function() {
	    return new bluebird(function(resolve) {
		  process.nextTick(function() {
		    resolve();
          });
	    });
      }).then(function() {
	    return new bluebird(function(resolve) {
		  process.nextTick(function() {
		    resolve();
		  });
	    });
	  }).then(function() {
	    ++called;
	  });
      return zurvan.waitForEmptyQueue();
    }).then(function() {
	  assert.equal(called, expectedOutput);
  	  return zurvan.releaseTimers();
    }).then(function() {
	  assert.strictEqual(originalSetImmediate, setImmediate);
    }).then(done, done);
  };
};

describe('zurvan', function() {
  describe('by default', function() {
    it('does not work with bluebird scheduler', bluebirdCompatibilityTestcase({}, 0)); 
  });
  
  // bluebird uses a different scheduler for promises than node engine does - namely, setImmediate (macroqueue), 
  // while V8 schedules promises on microqueue. Additionally, bluebird captures global.setImmediate in a local variable,
  // thus making it insufficient to change setTimeout itself. Luckily, it uses setImmediate.call (at least up to version 3.0)
  // so making setImmediate.call look like faked setImmediate does the trick. For version 3.0 and earlier
  describe('under special configuration (for compatibility with external libraries)', function() {
    it('specially for bluebird changes its scheduler', bluebirdCompatibilityTestcase({bluebird:bluebird}, 1));
	it('throws on wrong type of bluebird configuration parameter', function(done) {
      zurvan.interceptTimers({bluebird:{}}).then(function() {
	    done(new Error("Should not accept object as bluebird"));
	  }, function() {
	    done();
	  });
	});
  });
});