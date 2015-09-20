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
  });
});
