var assert = require("assert");
var Thoth = require("../Thoth");

describe('Thoth', function() {
  describe('after stopping time', function() {
    beforeEach(function(done) {
	  Thoth.stopTime();
	  done();
	});
	
	afterEach(function(done) {
	  Thoth.startTime();
	  done();
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
		done();
	  }, 40);
	  
	  clearTimeout(a);
	  clearInterval(b);
	  Thoth.advanceTime(100);
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
});