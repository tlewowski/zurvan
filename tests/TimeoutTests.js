var assert = require("assert");
var Thoth = require("../Thoth");

describe('Thoth', function() {
  describe('after capturing timers', function() {
    beforeEach(function(done) {
	  Thoth.stopTime();
	  done();
	});
	afterEach(function(done) {
	  Thoth.startTime();
	  done();
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
	
	it('is called in order of dueTime', function(done) {
	  
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
	  }, 50);
	  
	  setTimeout(function() {
	    calls.push(2);
	  }, 1100);
	  
	  setTimeout(function() {
	    assert.deepEqual(calls, [1]);
	    done();
	  }, 1000);
	  
	  Thoth.advanceTime(1500);
	});
	
	
	it('still executes async callbacks in order of dueTime', function(done) {
	
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
		setTimeout(function() {
		  calls.push(2);
		}, 50);
	  }, 50);
	
	  setTimeout(function() {
	    assert.deepEqual(calls, [1,2]);
		done();
	  }, 150);
	  
	  Thoth.advanceTime(150);
	});
	
	it('executes async callbacks after all immediates (queue) is cleared', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
	    setImmediate(function() {
		  calls.push(2);
		  setImmediate(function() {
		    calls.push(3);
		  });
		});
	  }, 50);
	  
	  setTimeout(function() {
	    assert.deepEqual(calls, [1,2,3]);
		done();
	  }, 100);
	  
	  Thoth.advanceTime(100);
	});
	
	it('expires timeouts one-by-one', function(done) {
	  setTimeout(function() {
	    setTimeout(function() {
		  done();
		}, 100);
	  }, 100);
	  
	  Thoth.advanceTime(200);  
	});
	
	it('throws when time is advanced from two places simultaneously', function(done) {
      setTimeout(function() {
	    try {
    	  Thoth.advanceTime(100);
		}
		catch(err) {
		  done();
		}
	  }, 50);
      
	  Thoth.advanceTime(100);
	})
  });
});