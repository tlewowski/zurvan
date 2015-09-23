var assert = require("assert");
var Zurvan = require("../Zurvan");

describe('Zurvan', function() {
  describe('extended stopping time', function() {
    beforeEach(function(done) {
	  Zurvan.stopTime().then(done, done);
	});
	afterEach(function(done) {
	  Zurvan.startTime().then(done);
	});
	
	it('expires timers at advancing time', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    assert.deepEqual(calls, [1]);
	  }, 1001);
	  
	  setTimeout(calls.push.bind(calls, 1), 1000);
	  
	  Zurvan.advanceTime(1001).then(done);
	});
		
	it('rejects attempt to move time backwards', function(done) {
	  Zurvan.advanceTime(-1).catch(function(err) {
        done();
	  });
	});
	
	it('does not expire timeout shortened advanceTime finishes', function(done) {
	  var called = false;
	  setTimeout(function() {
	    called = true;
	  }, 100);
	  
	  Zurvan.advanceTime(50).then(function() {
	    assert(!called);
	    return Zurvan.advanceTime(50);
	  }).then(function() {
	    assert(called);
		done();
	  });
	});

	it('calls intervals in cycle', function(done) {
	  var calls = [];
	  setInterval(calls.push.bind(calls, 1), 100);
	  
	  setTimeout(function() {
	    assert.deepEqual([1,1,1,1], calls);
		done();
	  }, 410);
	  
	  Zurvan.advanceTime(410);
	});
	
	it('can call both timeouts and intervals', function(done) {
	  var calls = [];
	  setInterval(function() {
	    calls.push(1);
		setTimeout(calls.push.bind(calls, 2), 10);
	  }, 10);
	  
	  setTimeout(function() {
	    assert.deepEqual([1,1,2,1,2,1,2], calls);
		done();
	  }, 41);
	  
	  Zurvan.advanceTime(42);
	});

	it('can pass arguments to timers', function(done) {
	  var calls = [];
	  
	  setTimeout(function(a,b) {
	    calls.push(a);
		calls.push(b);
	  }, 50, 2, 5);
	  
	  setTimeout(function() {
        assert.deepEqual(calls, [2, 5]);
        done();
	  }, 1050);

	  Zurvan.advanceTime(50).then(function() {
	    return Zurvan.advanceTime(1000);
	  });	  
	});
	
	it('is called in order of dueTime', function(done) {
	  
	  var calls = [];
	  setTimeout(calls.push.bind(calls, 1), 50);

	  setTimeout(function() {
	    assert.deepEqual(calls, [1]);
	    done();
	  }, 1000);
	  
	  Zurvan.advanceTime(1500);
	});
	
	
	it('still executes async callbacks in order of dueTime', function(done) {
	
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
		setTimeout(calls.push.bind(calls, 2), 50);
	  }, 50);
	
	  setTimeout(function() {
	    assert.deepEqual(calls, [1,2]);
		done();
	  }, 150);
	  
	  Zurvan.advanceTime(150);
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
	  
	  setTimeout(function() {
	    assert.deepEqual(calls, [1,2,3]);
		done();
	  }, 100);
	  
	  Zurvan.advanceTime(100);
	});
	
	it('expires timeouts one-by-one', function(done) {
	  setTimeout(function() {
	    setTimeout(done, 100);
	  }, 100);
	  
	  Zurvan.advanceTime(200);  
	});
	
	it('throws when time is advanced from two places simultaneously', function(done) {
      setTimeout(function() {
    	  Zurvan.advanceTime(100)
		    .catch(function(err) {
		      done();
		    });
	  }, 50);
      
	  Zurvan.advanceTime(100);
	});
	
	it('immediates are called shortened timeouts', function(done) {
	  var calls = [];
	  setImmediate(function() {
	    calls.push(1); 
		setImmediate(calls.push.bind(calls, 4));
	  });
	  
	  setTimeout(function() {
	    calls.push(2);
		setImmediate(function() {calls.push(3);});
	    setTimeout(function() {
		  assert.deepEqual([1, 4, 2, 3], calls);
		  done();
		}, 50);
	  }, 50);
	  
	  Zurvan.advanceTime(100);
	});
	
	it('takes into account setTimeouts in setImmediates when forwarding time', function(done) {
	  var calls = [];
	  setImmediate(function() {
	    calls.push(1);
		setTimeout(calls.push.bind(calls, 2), 50);
	  });
	  
	  setTimeout(function() {
	    assert.deepEqual([1,2], calls);
		done();
	  }, 100);
	  
	  Zurvan.advanceTime(100);
	});
	
	it('takes into account setTimeout in process.nextTick when forwarding time', function(done) {
	  var calls = [];
	  process.nextTick(function() {
	    calls.push(1);
		setTimeout(calls.push.bind(calls, 2), 10);
	  });
	  
	  setTimeout(function() {
	    assert.deepEqual([1,2], calls);
		done();
	  }, 20);
	  
	  Zurvan.advanceTime(20);
	});
  });
});