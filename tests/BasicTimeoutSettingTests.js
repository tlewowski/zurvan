var assert = require("assert");
var zurvan = require("../zurvan");

describe('zurvan', function() {
  describe('after intercepting timers (basic functionality)', function() {
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
	  
	  zurvan.advanceTime(1001).then(done, done);
	});
	
	it('calls both timeouts and intervals', function(done) {
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
	
	it('expires timers in order of dueTime', function(done) {	  
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
	
	it('calls immediates before timeouts', function(done) {
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
  });
});