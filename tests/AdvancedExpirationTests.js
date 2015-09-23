var assert = require("assert");
var Zurvan = require("../Zurvan");

describe('Zurvan', function() {
  describe('while manages time', function() {
    shortenedEach(function(done) {
	  Zurvan.stopTime().then(done, done);
	});
	extendedEach(function(done) {
	  Zurvan.startTime().then(done, done);
	});
	
	it('if no timeouts available, expiration of all does not advance time', function(done) {
	  var calls = [];
	  setInterval(function() {
	    calls.push(1);
	  }, 1000);
	  
	  assert.equal(0, process.uptime());
	  Zurvan.expireAllTimeouts().then(function() {
	    assert.equal(0, process.uptime());
		assert.deepEqual([], calls);
	  }).then(done, done);
	});
	
	it('if no timers available, expiration of single one does not advance time', function(done) {
	  assert.equal(0, process.uptime());
	  Zurvan.forwardTimeToNextTimer().then(function() {
	    assert.equal(0, process.uptime());
	  }).then(done, done);
	});

	it('is able to expire all set timeouts', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
	  }, 50);
	  
	  setTimeout(function() {
	    calls.push(2);
	  }, 1000);
	  
	  setImmediate(function() {
	    calls.push(0);
	  });
	  
	  Zurvan.expireAllTimeouts().then(function() {
	    assert.deepEqual([0, 1, 2], calls);
		assert.equal(1, process.uptime());
	  }).then(done, done);
	});
	
	it('allows intervals to remain when expiring all timeouts', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
	  }, 500);
	  setInterval(function() {
	    calls.push(2);
	  }, 1000);
	  
	  setTimeout(function() {
	    calls.push(3);
	  }, 2000);
	  
	  Zurvan.expireAllTimeouts().then(function() {
	    assert.deepEqual([1,2,3,2], calls);
	  }).then(done, done);
	});
	
	it('forwarding to next timer takes into account timers and intervals', function(done) {
	  var calls = [];
	  setImmediate(function() {
	    calls.push(1);
	  });
	  
	  setTimeout(function() {
	    calls.push(2);
		process.nextTick(function() {
		  calls.push(5);
		});
	  }, 500);
	  
	  setTimeout(function() {
	    calls.push(3);
        assert.equal(0.5, process.uptime());
	  }, 500);
	  
	  setInterval(function() {
	    calls.push(4);
		setImmediate(function() {
		  calls.push(6);
		});
	  }, 1000);
	  
	  Zurvan.forwardTimeToNextTimer().then(function() {
	    assert.deepEqual([1,2,5,3], calls);
		return Zurvan.forwardTimeToNextTimer();
	  }).then(function() {
	    assert.deepEqual([1,2,5,3,4,6], calls);
		return Zurvan.forwardTimeToNextTimer();
	  }).then(function() {
	    assert.deepEqual([1,2,5,3,4,6,4,6], calls);
	  }).then(done, done);
	});
  });
});
