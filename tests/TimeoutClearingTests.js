"use strict";
var assert = require("assert");
var zurvan = require("../zurvan");

describe('zurvan', function() {
  describe('after intercepting timers', function() {
    beforeEach(function(done) {
	  zurvan.interceptTimers().then(done, done);
	});
	
	afterEach(function(done) {
	  zurvan.releaseTimers().then(done, done);
	});

    it('does not call cleared immediates', function(done) {
	  var calls = [];
	  var a = setImmediate(function() {
	    calls.push(1);
	  });
	  
	  setImmediate(function() {
	    assert.deepEqual([], calls);
		done();
	  });
	  
	  clearImmediate(a);
	});
	
	it('does not call cleared timeouts/intervals', function(done) {
	  var calls = [];
	  var a = setTimeout(function() {
	    calls.push(1);
	  }, 10);
	  
	  var b = setInterval(function() {
	    calls.push(2);
	  }, 10);
	  
	  setTimeout(function() {
	    assert.deepEqual([], calls);
	  }, 40);
	  
	  clearTimeout(a);
	  clearInterval(b);
	  zurvan.advanceTime(100).then(done, done);
	});

	it('creates unstrigifiable handles', function(done) {
	  var immediateHandle = setImmediate(function() {});
	  var timeoutHandle = setTimeout(function() {}, 0);
	  var intervalHandle = setInterval(function() {}, 1);
	  
	  assert.throws(function() {JSON.stringify(immediateHandle);});
	  assert.throws(function() {JSON.stringify(timeoutHandle);});
	  assert.throws(function() {JSON.stringify(intervalHandle);});
      done();
	});
  });
  
  describe('after requesting to intercept timers', function() {	
	it('rejects if time has not yet passed', function(done) {
	  var rejected;
	  zurvan.interceptTimers().then(function() {
	    setTimeout(function() {
	      zurvan.releaseTimers().then(function(err) {
            rejected = false;
		  }, function(err) {
		    rejected = true;
		  });
	    }, 25);

        return zurvan.advanceTime(50);
	  }).then(function() {
	    assert.equal(process.uptime(), 0.05);
        assert(rejected === true);
		return zurvan.releaseTimers();
	  }).then(done, done);
	});
	
	it('rejects if timers were not intercepted', function(done) {
	  zurvan.releaseTimers().then(function() {
	    done(new Error("Timers were not intercepted yet - releasing shall be rejected"));
	  }, function() {
	    done();
	  });
	});
  });
  
  describe('after intercepting timers', function() {
    it('rejects request to intercept them again', function(done) {
	  zurvan.interceptTimers().then(function() {
	    return zurvan.interceptTimers();
	  }).then(function() {
	    done(new Error("Timers were already intercepted - shall not be able to intercept them again"));
	  }, function() {
	    zurvan.releaseTimers().then(done, done);
	  });
	});
  });
});