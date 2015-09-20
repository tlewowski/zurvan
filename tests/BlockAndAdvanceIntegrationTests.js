var assert = require("assert");
var Thoth = require("../Thoth");

describe('Thoth', function() {
  describe('while manages time', function() {
    beforeEach(function(done) {
	  Thoth.stopTime();
	  done();
	});
	afterEach(function(done) {
	  Thoth.startTime().then(done, done);
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
	  
	  Thoth.blockSystem(45).then(function() {
	    return Thoth.advanceTime(40);
	  }).then(function() {
	    assert.deepEqual([1,2,3,4,2,2], calls);
	  }).then(done, done);
	});
	
	it('can block system while time is being advanced', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    assert.deepEqual([5, 0], process.hrtime());
	    calls.push(1);
		Thoth.blockSystem(1000).then(function() {
		  assert.equal(6, process.uptime());
		});
	  }, 5000);
	  
	  setTimeout(function() {
	    assert.deepEqual([6, 0], process.hrtime());
		calls.push(2);
	  }, 5000);
	  
	  Thoth.advanceTime(7000).then(function() {
	    assert.deepEqual(7, process.uptime());
		assert.deepEqual([1,2], calls);
	  }).then(done, done);
	});
	
	it('cannot block system for longer than requested advance time', function(done) {
	  setTimeout(function() {
	    Thoth.blockSystem(2000);
	  }, 50);
	  
	  setTimeout(function() {
	    assert.equal(0.1, process.uptime());
	  }, 100);
	  
	  Thoth.advanceTime(1000).then(done, done);
	});
  });
});
