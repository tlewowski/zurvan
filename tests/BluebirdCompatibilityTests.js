var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");
var assert = require("assert");

describe('zurvan', function() {
  describe('by default', function() {
    it('does not override setImmediate.call, setImmediate.apply and setImmediate.bind', function(done) {
	  var originalSetImmediate = global.setImmediate;
	  var called = 0;
	  
	  zurvan.interceptTimers().then(function() {
	    assert.notStrictEqual(originalSetImmediate, setImmediate); // originalSetImmediate cannot be mutated any more, unfortunately
		
		// plain Function.call, Function.bind, Function.apply
		assert.strictEqual(originalSetImmediate.call, setImmediate.call);
		assert.strictEqual(originalSetImmediate.bind, setImmediate.bind);
		assert.strictEqual(originalSetImmediate.apply, setImmediate.apply);
	  }).then(function() {
	    originalSetImmediate.call(global, function() {
		  originalSetImmediate.call(global, function() {
		    originalSetImmediate.call(global, function() {
			  originalSetImmediate.call(global, function(a) {
			    called = called + a;
			  }, 100);
			});
		  });
		});
		
		return zurvan.waitForEmptyQueue();
	  }).then(function() {
	    assert.equal(called, 0);
		return zurvan.releaseTimers();
	  }).then(done, done);
    });
  });
  
  describe('under special configuration (for compatibility with external libraries)', function() {
    // bluebird uses a different scheduler for promises than node engine does - namely, setImmediate (macroqueue), 
	// while V8 schedules promises on microqueue. Additionally, bluebird captures global.setImmediate in a local variable,
	// thus making it insufficient to change setTimeout itself. Luckily, it uses setImmediate.call (at least up to version 3.0)
	// so making setImmediate.call look like faked setImmediate does the trick. For version 3.0 and earlier
    it('overrides ORIGINAL setImmediate.call, setImmediate.apply and setImmediate.bind - specially for _bluebird_', function(done) {
	  var originalSetImmediate = global.setImmediate;
	  var called = 0;
	  
	  zurvan.interceptTimers({fakeOriginalSetImmediateMethods: true}).then(function() {
	    assert.notStrictEqual(originalSetImmediate, setImmediate); // originalSetImmediate cannot be mutated any more, unfortunately
		
		// faked - done for all, to have at least a little consistency. originalSetTimeout(...) calls would still fail!
		assert.notStrictEqual(originalSetImmediate.call, setImmediate.call);
		assert.notStrictEqual(originalSetImmediate.bind, setImmediate.bind);
		assert.notStrictEqual(originalSetImmediate.apply, setImmediate.apply);
	  }).then(function() {
	    originalSetImmediate.call(global, function() {
		  originalSetImmediate.call(global, function() {
		    originalSetImmediate.call(global, function() {
			  originalSetImmediate.call(global, function() {
			    ++called;
			  });
			});
		  });
		});
		
		return zurvan.waitForEmptyQueue();
	  }).then(function() {
	    assert.equal(1, called);
	    
		originalSetImmediate.apply(global, [function(a) {
		  originalSetImmediate.apply(global, [function(b) {
		    originalSetImmediate.apply(global, [function(c) {
			  originalSetImmediate.apply(global, [function(d) {
			    called = called + a + b + c + d;
			  }, 10]);
			}, 100]);
		  }, 1000]);
		}, 10000]);
		
		return zurvan.waitForEmptyQueue();
	  }).then(function() {
	    assert.equal(11111, called);
		
		// just so that you'll know - explicit calling of originalSetImmediate isn't faked :(
		originalSetImmediate(function() {
		  originalSetImmediate(function() {
		    originalSetImmediate(function() {
			  called = 0;
			});
		  });
		});
		
		return zurvan.waitForEmptyQueue();
	  }).then(function() {
	    assert.equal(11111, called);		
	    return zurvan.releaseTimers();
	  }).then(done, done);
	});
  });
});