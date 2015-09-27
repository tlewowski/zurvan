var assert = require("assert");
var zurvan = require("../zurvan");
var TimeUnit = require("../TimeUnit");

describe('zurvan', function() {
  describe('during blocking call', function() {
    beforeEach(function(done) {
	  zurvan.interceptTimers().then(done, done);
	});
	
	afterEach(function(done) {
	  zurvan.releaseTimers().then(done, done);
	});

    it('expires all timeouts at once in proper order', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    assert.equal(process.uptime(), 5);
		calls.push(1);
	  }, 1000);
	  
	  setTimeout(function() {
	    assert.equal(process.uptime(), 5);
	    calls.push(2);
	  }, 2000);
	
	  zurvan.blockSystem(5000);
	  
      assert.equal(process.uptime(), 5);
	  zurvan.waitForEmptyQueue().then(function() {
        assert.equal(process.uptime(), 5);
	    assert.deepEqual([1,2], calls);
	  }).then(done, done);
	});
	
	it('calls intervals only once if system is blocked', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
	  }, 100);
	  
	  setInterval(function() {
	    calls.push(2);  
	  }, 100);
	  
	  setTimeout(function() {
	    calls.push(0);
	  }, 50);
	  
	  setInterval(function() {
	    calls.push(3);
	  }, 200);
	  
	  zurvan.blockSystem(1000);
	  zurvan.waitForEmptyQueue().then(function() {
		  assert.deepEqual([0,1,2,3], calls);
		}).then(done, done);
	});
	
	it('does not give precedence to setImmediates', function(done) {
	  var calls = [];
	  setImmediate(function() {
	    calls.push(1);
	    setImmediate(function() {
		  calls.push(2);
		});
	  });
	  
	  setTimeout(function() {
	    calls.push(3);
	  }, 40);
	  
	  zurvan.blockSystem(TimeUnit.seconds(1));
	  zurvan.waitForEmptyQueue().then(function() {
	    assert.deepEqual([1,3,2], calls);
	  }).then(done, done);
	});

    it('thows at negative time', function(done) {
      assert.throws(zurvan.blockSystem.bind(zurvan, -1));
      done();
	});
  });
});