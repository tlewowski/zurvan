"use strict";
var assert = require("assert");
var zurvan = require("../zurvan");

var timers = require('timers');

describe('required node timeouts in zurvan', function() {
  describe('after intercepting timers (more sophisticated usage)', function() {
    beforeEach(function() {
	  return zurvan.interceptTimers();
	});
	afterEach(function() {
	  return zurvan.releaseTimers();
	});
	
	it('rejects attempt to move time backwards', function(done) {
	  zurvan.advanceTime(-1).catch(function(err) {
        done();
	  });
	});
	
	it('does not expire timeout before time is advanced far enough', function(done) {
	  var called = false;
	  setTimeout(function() {
	    called = true;
	  }, 100);
	  zurvan.advanceTime(50).then(function() {
	    assert(!called);
	    return zurvan.advanceTime(50);
	  }).then(function() {
	    assert(called);
	  }).then(done, done);
	});
	
	it('can pass arguments to timers', function(done) {
	  var calls = [];
	  
	  setTimeout(function(a,b) {
	    calls.push(a);
		calls.push(b);
	  }, 50, 2, 5);
	  
	  timers.setTimeout(function() {
	    calls.push(10);
	  }, 1050);

	  zurvan.advanceTime(50).then(function() {
	    assert.deepEqual(calls, [2, 5]);
		return zurvan.advanceTime(1000);
	  }).then(function() {
	    assert.deepEqual(calls, [2, 5, 10]);
	  }).then(done, done);
	});	
	
	it('executes async callbacks in order of dueTime, even if timeouts are nested', function(done) {
	
	  var calls = [];
	  timers.setTimeout(function() {
	    calls.push(1);
		timers.setTimeout(calls.push.bind(calls, 2), 50);
	  }, 50);
	
	  setInterval(function() {
        calls.push(100);
	  }, 150);
	  
	  zurvan.advanceTime(150).then(function() {
	    assert.deepEqual(calls, [1,2,100]);
	  }).then(done, done);
	});
	
	it('executes async callbacks after all immediates (macroqueue) are cleared', function(done) {
	  var calls = [];
	  timers.setTimeout(function() {
	    calls.push(1);

	    setImmediate(function() {
		  calls.push(2);
		  setImmediate(calls.push.bind(calls, 3));
		});
	  }, 50);
	  
	  timers.setTimeout(function(a) {
	    calls.push(a);
	  }, 100, 12);
	  
	  zurvan.advanceTime(100).then(function() {
		assert.deepEqual(calls, [1,2,3,12]);
	  }).then(done, done);
	});
	
	it('throws when time is advanced from two places simultaneously', function(done) {
      timers.setTimeout(function() {
    	  zurvan.advanceTime(100)
		    .catch(function(err) {
		      done();
		    });
	  }, 50);
      
	  zurvan.advanceTime(100);
	});
	
	it('takes into account setTimeouts in setImmediates when forwarding time', function(done) {
	  var calls = [];
	  setImmediate(function() {
	    calls.push(1);
		timers.setTimeout(calls.push.bind(calls, 2), 50);
	  });
	  
	  timers.setTimeout(function() {
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
		timers.setTimeout(calls.push.bind(calls, 2), 10);
	  });
	  
	  timers.setInterval(function() {
	    calls.push(10);
	  }, 20);
	  
	  zurvan.advanceTime(20).then(function() {
	    assert.deepEqual([1,2,10], calls);
	  }).then(done, done);
	});
  });
});