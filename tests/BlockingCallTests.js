var assert = require("assert");
var Zurvan = require("../Zurvan");

describe('Zurvan', function() {
  describe('during blocking call', function() {
    beforeEach(function(done) {
	  Zurvan.stopTime().then(done, done);
	});
	
	afterEach(function(done) {
	  Zurvan.startTime().then(done, done);
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
	
	  Zurvan.blockSystem(5000).then(function() {
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
	  
	  Zurvan.blockSystem(1000)
	    .then(function() {
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
	  
	  Zurvan.blockSystem(1000).then(function() {
	    assert.deepEqual([1,3,2], calls);
	  }).then(done, done);
	});

    it('rejects negative time', function(done) {
      Zurvan.blockSystem(-1).then(function() {
	    done(new Error("Should not be possible to block for negative time"));
  	  }, function() {
	    done();
	  });
    });
  });
});