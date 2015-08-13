var assert = require("assert");
var Thoth = require("../Thoth");

describe('Thoth', function() {
  describe('after capturing timers', function() {
    before(function() {
	  Thoth.stopTime();
	});
	after(function() {
	  Thoth.startTime();
	});
	
    it('expires timers at advancing time', function(done) {

	  var calls = [];
	  setTimeout(function() {
	    assert.deepEqual(calls, [1]);
	    done();
	  }, 1001);
	  
	  setTimeout(function() {
        calls.push(1);	  
	  }, 1000);
	  
	  Thoth.advanceTime(1001);
	});
	
	it('can pass arguments to timers', function(done) {
	  var calls = [];
	  
	  setTimeout(function(a,b) {
	    calls.push(a);
		calls.push(b);
		Thoth.advanceTime(1000);
	  }, 50, 2, 5);
	  
	  setTimeout(function() {
        assert.deepEqual(calls, [2, 5]);
        done();		
	  }, 1050);

	  Thoth.advanceTime(50);	  
	});
	
	it('is called in async way in order of dueTime', function(done) {
	  
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
	  }, 50);
	  
	  setTimeout(function() {
	    // tricky!
	    // this shouldn't be executed in test, as happens after async done();
		
	    calls.push(2);
		assert(false); 
	  }, 1100);
	  
	  setTimeout(function() {
	    assert.deepEqual(calls, [1]);
	    done();
	  }, 1000);
	  
	  Thoth.advanceTime(1500);
	});
  });
});