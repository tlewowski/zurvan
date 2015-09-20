var assert = require("assert");
var Thoth = require("../Thoth");

describe('Thoth', function() {
  describe('after stopping time', function() {
    beforeEach(function(done) {
	  Thoth.stopTime().then(done, done);
	});
	
	afterEach(function(done) {
	  Thoth.startTime().then(done, done);
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
	  Thoth.advanceTime(100).then(done, done);
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
	  Thoth.stopTime().then(function() {
	    setTimeout(function() {
	      Thoth.startTime().then(function() {
            rejected = false;
		  }, function() {
		    rejected = true;
		  });
	    }, 25);

        return Thoth.advanceTime(50);
	  }).then(function() {
        assert(rejected === true);
		return Thoth.startTime();
	  }).then(done, done);
	});
  });
});