var assert = require("assert");
var zurvan = require("../zurvan");

describe('zurvan', function() {
  describe('while manages time', function() {
    beforeEach(function(done) {
	  zurvan.interceptTimers().then(done, done);
	});
	afterEach(function(done) {
	  zurvan.releaseTimers().then(done, done);
	});
	
	it('can integrate advancing time and blocking', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
		setTimeout(function() {
		  assert.equal(0.055, process.uptime());
		  calls.push(4);
		}, 10);
	  }, 10);
	  setInterval(function() {
	    calls.push(2);
	  }, 20);
	  setTimeout(function() {
	    calls.push(3);
	  }, 50);
	  
	  zurvan.blockSystem(45);
	  
	  zurvan.waitForEmptyQueue().then(function() {
	    return zurvan.advanceTime(40);
	  }).then(function() {
	    assert.deepEqual([1,2,3,4,2,2], calls);
	  }).then(done, done);
	});
	
	it('can block system while time is being advanced', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    assert.deepEqual([5, 0], process.hrtime());
	    calls.push(1);
		zurvan.blockSystem(1000);
        assert.equal(6, process.uptime());
	  }, 5000);
	  
	  setTimeout(function() {
	    assert.deepEqual([6, 0], process.hrtime());
		calls.push(2);
	  }, 5000);
	  
	  zurvan.advanceTime(7000).then(function() {
	    assert.deepEqual(7, process.uptime());
		assert.deepEqual([1,2], calls);
	  }).then(done, done);
	});
	
	it('cannot block system for longer than requested advance time', function(done) {
	  setTimeout(function() {
    	assert.throws(zurvan.blockSystem.bind(zurvan, 2000));
	  }, 50);
	  
	  setTimeout(function() {
	    assert.equal(0.1, process.uptime());
	  }, 100);
	  
	  zurvan.advanceTime(1000).then(done, done);
	});
	
	it('when system is blocked, time cannot be additionally forwarded', function(done) {
	  var rejected;
	  setTimeout(function() {
	    assert.equal(2, process.uptime());
	    zurvan.advanceTime(1000).then(function() {
		  rejected = false;
		}, function() {
		  rejected = true;
		});
	  }, 1000);
	  
	  zurvan.blockSystem(2000);
	  zurvan.waitForEmptyQueue().then(function() {
	    assert.equal(2, process.uptime());
		assert(rejected);
	  }).then(done, done);
	});
  });
});
