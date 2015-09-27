var assert = require("assert");
var zurvan = require("../zurvan");

describe('zurvan', function() {
  describe('after intercepting timers', function() {
    beforeEach(function(done) {
	  zurvan.interceptTimers().then(done, done);
	});
	afterEach(function(done) {
	  zurvan.releaseTimers().then(done);
	});
	
	it('expires timers at advancing time', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    assert.deepEqual(calls, [1]);
	  }, 1001);
	  
	  setTimeout(calls.push.bind(calls, 1), 1000);
	  
	  zurvan.advanceTime(1001).then(done);
	});
		
	it('rejects attempt to move time backwards', function(done) {
	  zurvan.advanceTime(-1).catch(function(err) {
        done();
	  });
	});
	
	it('does not expire timeout shortened advanceTime finishes', function(done) {
	  var called = false;
	  setTimeout(function() {
	    called = true;
	  }, 100);
	  
	  zurvan.advanceTime(50).then(function() {
	    assert(!called);
	    return zurvan.advanceTime(50);
	  }).then(function() {
	    assert(called);
		done();
	  });
	});

	it('calls intervals in cycle', function(done) {
	  var calls = [];
	  setInterval(calls.push.bind(calls, 1), 100);
	  
	  setTimeout(function() {
	    calls.push(4);
	  }, 410);
	  
	  zurvan.advanceTime(410).then(function() {
		assert.deepEqual([1,1,1,1, 4], calls);	    
	  }).then(done, done);
	});
	
	it('can call both timeouts and intervals', function(done) {
	  var calls = [];
	  setInterval(function() {
	    calls.push(1);
		setTimeout(calls.push.bind(calls, 2), 10);
	  }, 10);
	  
	  setTimeout(function() {
	    calls.push(5);
	  }, 41);
	  
	  zurvan.advanceTime(42).then(function() {
	    assert.deepEqual([1,1,2,1,2,1,2,5], calls);
	  }).then(done, done);
	});

	it('can pass arguments to timers', function(done) {
	  var calls = [];
	  
	  setTimeout(function(a,b) {
	    calls.push(a);
		calls.push(b);
	  }, 50, 2, 5);
	  
	  setTimeout(function() {
	    calls.push(10);
	  }, 1050);

	  zurvan.advanceTime(50).then(function() {
	    assert.deepEqual(calls, [2, 5]);
		return zurvan.advanceTime(1000);
	  }).then(function() {
	    assert.deepEqual(calls, [2, 5, 10]);
	  }).then(done, done);
	});
	
	it('is called in order of dueTime', function(done) {
	  
	  var calls = [];
	  setTimeout(calls.push.bind(calls, 1), 50);

	  setTimeout(function() {
	    calls.push(2);
	  }, 1000);
	  
	  zurvan.advanceTime(1500).then(function() {
	    assert.equal(process.uptime(), 1.5);
	    assert.deepEqual(calls, [1, 2]);
	  }).then(done, done);
	});
	
	
	it('still executes async callbacks in order of dueTime', function(done) {
	
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
		setTimeout(calls.push.bind(calls, 2), 50);
	  }, 50);
	
	  setTimeout(function() {
        calls.push(100);
	  }, 150);
	  
	  zurvan.advanceTime(150).then(function() {
	    assert.deepEqual(calls, [1,2,100]);
	  }).then(done, done);
	});
	
	it('executes async callbacks extended all immediates (queue) is cleared', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);

	    setImmediate(function() {
		  calls.push(2);
		  setImmediate(calls.push.bind(calls, 3));
		});
	  }, 50);
	  
	  setTimeout(function(a) {
	    calls.push(a);
	  }, 100, 12);
	  
	  zurvan.advanceTime(100).then(function() {
		assert.deepEqual(calls, [1,2,3,12]);
	  }).then(done, done);
	});
	
	it('throws when time is advanced from two places simultaneously', function(done) {
      setTimeout(function() {
    	  zurvan.advanceTime(100)
		    .catch(function(err) {
		      done();
		    });
	  }, 50);
      
	  zurvan.advanceTime(100);
	});
	
	it('immediates are called befored timeouts', function(done) {
	  var calls = [];
	  setImmediate(function() {
	    calls.push(1); 
		setImmediate(calls.push.bind(calls, 4));
	  });
	  
	  setTimeout(function() {
	    calls.push(2);
		setImmediate(function() {calls.push(3);});
	    setTimeout(function() {
		  calls.push(45);
		}, 50);
	  }, 50);
	  
	  zurvan.advanceTime(100).then(function() {
        assert.deepEqual([1, 4, 2, 3, 45], calls);
	  }).then(done, done);
	});
	
	it('takes into account setTimeouts in setImmediates when forwarding time', function(done) {
	  var calls = [];
	  setImmediate(function() {
	    calls.push(1);
		setTimeout(calls.push.bind(calls, 2), 50);
	  });
	  
	  setTimeout(function() {
	    calls.push(3);
	  }, 100);
	  
	  zurvan.advanceTime(100).then(function() {
	    assert.deepEqual([1,2,3], calls);
	  }).then(done, done);
	});
	
	it('takes into account setTimeout in process.nextTick when forwarding time', function(done) {
	  var calls = [];
	  process.nextTick(function() {
	    calls.push(1);
		setTimeout(calls.push.bind(calls, 2), 10);
	  });
	  
	  setTimeout(function() {
	    calls.push(10);
	  }, 20);
	  
	  zurvan.advanceTime(20).then(function() {
	    assert.deepEqual([1,2,10], calls);
	  }).then(done, done);
	});
  });
});