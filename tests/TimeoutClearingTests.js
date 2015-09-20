var assert = require("assert");
var Zurvan = require("../Zurvan");

describe('Zurvan', function() {
  describe('after stopping time', function() {
    beforeEach(function(done) {
	  Zurvan.stopTime().then(done, done);
	});
	
	afterEach(function(done) {
	  Zurvan.startTime().then(done, done);
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
	  Zurvan.advanceTime(100).then(done, done);
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
  
  describe('after requesting to start time', function() {	
	it('rejects if time has not yet passed', function(done) {
	  var rejected;
	  Zurvan.stopTime().then(function() {
	    setTimeout(function() {
	      Zurvan.startTime().then(function() {
            rejected = false;
		  }, function() {
		    rejected = true;
		  });
	    }, 25);

        return Zurvan.advanceTime(50);
	  }).then(function() {
        assert(rejected === true);
		return Zurvan.startTime();
	  }).then(done, done);
	});
	
	it('rejects if time was not stopped', function(done) {
	  Zurvan.startTime().then(function() {
	    done(new Error("Time was not stopped yet - starting shall be rejected"));
	  }, function() {
	    done();
	  });
	});
  });
  
  describe('after stopping time', function() {
    it('rejects stopping it again', function(done) {
	  Zurvan.stopTime().then(function() {
	    return Zurvan.stopTime();
	  }).then(function() {
	    done(new Error("Time was already stopped - shall not be able to stop it again"));
	  }, function() {
	    Zurvan.startTime().then(done, done);
	  });
	});
  });
});