var assert = require("assert");
var Zurvan = require("../Zurvan");

describe('Zurvan', function() {
  describe('while manages time', function() {
    beforeEach(function(done) {
	  Zurvan.stopTime().then(done, done);
	});
	afterEach(function(done) {
	  Zurvan.startTime().then(done, done);
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
	  
	  Zurvan.blockSystem(45).then(function() {
	    return Zurvan.advanceTime(40);
	  }).then(function() {
	    assert.deepEqual([1,2,3,4,2,2], calls);
	  }).then(done, done);
	});
	
	it('can block system while time is being advanced', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    assert.deepEqual([5, 0], process.hrtime());
	    calls.push(1);
		Zurvan.blockSystem(1000).then(function() {
		  assert.equal(6, process.uptime());
		});
	  }, 5000);
	  
	  setTimeout(function() {
	    assert.deepEqual([6, 0], process.hrtime());
		calls.push(2);
	  }, 5000);
	  
	  Zurvan.advanceTime(7000).then(function() {
	    assert.deepEqual(7, process.uptime());
		assert.deepEqual([1,2], calls);
	  }).then(done, done);
	});
	
	it('cannot block system for longer than requested advance time', function(done) {
	  setTimeout(function() {
	    Zurvan.blockSystem(2000);
	  }, 50);
	  
	  setTimeout(function() {
	    assert.equal(0.1, process.uptime());
	  }, 100);
	  
	  Zurvan.advanceTime(1000).then(done, done);
	});
	
	it('when system is blocked, time cannot be additionally forwarded', function(done) {
	  var rejected;
	  setTimeout(function() {
	    assert.equal(2, process.uptime());
	    Zurvan.advanceTime(1000).then(function() {
		  rejected = false;
		}, function() {
		  rejected = true;
		});
	  }, 1000);
	  
	  Zurvan.blockSystem(2000).then(function() {
	    assert.equal(2, process.uptime());
		assert(rejected);
	  }).then(done, done);
	});
  });
});
