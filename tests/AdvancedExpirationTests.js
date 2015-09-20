var assert = require("assert");
var Thoth = require("../Thoth");

describe('Thoth', function() {
  describe('while manages time', function() {
    beforeEach(function(done) {
	  Thoth.stopTime().then(done, done);
	});
	afterEach(function(done) {
	  Thoth.startTime().then(done, done);
	});
	
	it('if no timeouts available, expiration of all does not advance time', function(done) {
	  var calls = [];
	  setInterval(function() {
	    calls.push(1);
	  }, 1000);
	  
	  assert.equal(0, process.uptime());
	  Thoth.expireAllTimeouts().then(function() {
	    assert.equal(0, process.uptime());
		assert.deepEqual([], calls);
	  }).then(done, done);
	});
	
	it('if no timers available, expiration of single one does not advance time', function(done) {
	  assert.equal(0, process.uptime());
	  Thoth.forwardTimeToNextTimer().then(function() {
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
	  
	  Thoth.expireAllTimeouts().then(function() {
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
	  
	  Thoth.expireAllTimeouts().then(function() {
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
	  
	  Thoth.forwardTimeToNextTimer().then(function() {
	    assert.deepEqual([1,2,5,3], calls);
		return Thoth.forwardTimeToNextTimer();
	  }).then(function() {
	    assert.deepEqual([1,2,5,3,4,6], calls);
		return Thoth.forwardTimeToNextTimer();
	  }).then(function() {
	    assert.deepEqual([1,2,5,3,4,6,4,6], calls);
	  }).then(done, done);
	});
  });
});
