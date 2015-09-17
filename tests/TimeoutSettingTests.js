var assert = require("assert");
var Thoth = require("../Thoth");

describe('Thoth', function() {
  describe('after stopping time', function() {
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
		
	it('throws on attempt to move time backwards', function(done) {
	  assert.throws(function() {
	    Thoth.advanceTime(-1);
	  });
	  done();
	});
	
	it('does not expire timeout before advanceTime finishes', function(done) {
	  var called = false;
	  setTimeout(function() {
	    called = true;
	    done();
	  }, 100);
	  
	  Thoth.advanceTime(50);
	  assert(!called);
	  Thoth.advanceTime(50);
	});

	it('calls intervals in cycle', function(done) {
	  var calls = [];
	  setInterval(function() {
	    calls.push(1);
	  }, 100);
	  
	  setTimeout(function() {
	    assert.deepEqual([1,1,1,1], calls);
		done();
	  }, 410);
	  
	  Thoth.advanceTime(410);
	});
	
	it('can call both timeouts and intervals', function(done) {
	  var calls = [];
	  setInterval(function() {
	    calls.push(1);
		setTimeout(function() {
		  calls.push(2);
		}, 10);
	  }, 10)
	  
	  setTimeout(function() {
	    assert.deepEqual([1,1,2,1,2,1,2], calls);
		done();
	  }, 41);
	  
	  Thoth.advanceTime(42);
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
	});
	
	it('immediates are called before timeouts', function(done) {
	  var calls = [];
	  setImmediate(function() {
	    calls.push(1); 
		setImmediate(function() {
		  calls.push(4);
        });
	  });
	  
	  setTimeout(function() {
	    calls.push(2);
		setImmediate(function() {calls.push(3);});
	    setTimeout(function() {
		  assert.deepEqual([1, 4, 2, 3], calls);
		  done();
		}, 50);
	  }, 50);
	  
	  Thoth.advanceTime(100);
	});
	
	it('takes into account setTimeouts in setImmediates when forwarding time', function(done) {
	  var calls = [];
	  setImmediate(function() {
	    calls.push(1);
		setTimeout(function() {
		  calls.push(2);
		}, 50);
	  });
	  
	  setTimeout(function() {
	    assert.deepEqual([1,2], calls);
		done();
	  }, 100);
	  
	  Thoth.advanceTime(100);
	});
	
	it('takes into account setTimeout in process.nextTick when forwarding time', function(done) {
	  var calls = [];
	  process.nextTick(function() {
	    calls.push(1);
		setTimeout(function() {
		  calls.push(2);
		}, 10);
	  });
	  
	  setTimeout(function() {
	    assert.deepEqual([1,2], calls);
		done();
	  }, 20);
	  
	  Thoth.advanceTime(20);
	});
  });
});