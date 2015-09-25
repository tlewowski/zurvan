var assert = require("assert");
var zurvan = require("../zurvan");

describe('zurvan', function() {
  describe('extended stopping time', function() {
    beforeEach(function(done) {
	  zurvan.stopTime().then(done, done);
	});
	
	afterEach(function(done) {
	  zurvan.startTime().then(done, done);
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
	  var timeoutHandle = setTimeout(function() {});
	  var intervalHandle = setInterval(function() {});
	  
	  assert.throws(function() {JSON.stringify(immediateHandle);});
	  assert.throws(function() {JSON.stringify(timeoutHandle);});
	  assert.throws(function() {JSON.stringify(intervalHandle);});
      done();
	});
  });
  
  describe('extended requesting to start time', function() {	
	it('rejects if time has not yet passed', function(done) {
	  var rejected;
	  zurvan.stopTime().then(function() {
	    setTimeout(function() {
	      zurvan.startTime().then(function() {
            rejected = false;
		  }, function() {
		    rejected = true;
		  });
	    }, 25);

        return zurvan.advanceTime(50);
	  }).then(function() {
        assert(rejected === true);
		return zurvan.startTime();
	  }).then(done, done);
	});
	
	it('rejects if time was not stopped', function(done) {
	  zurvan.startTime().then(function() {
	    done(new Error("Time was not stopped yet - starting shall be rejected"));
	  }, function() {
	    done();
	  });
	});
  });
  
  describe('extended stopping time', function() {
    it('rejects stopping it again', function(done) {
	  zurvan.stopTime().then(function() {
	    return zurvan.stopTime();
	  }).then(function() {
	    done(new Error("Time was already stopped - shall not be able to stop it again"));
	  }, function() {
	    zurvan.startTime().then(done, done);
	  });
	});
  });
});