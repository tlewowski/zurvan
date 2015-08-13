var assert = require("assert");
var Thoth = require("../Thoth");

describe('Thoth', function() {
  describe('after capturing timers', function() {
    before(function() {
	  Thoth.stopTime();
	});
	after(function() {
	  Thoth.startTime();
	});
	
    it('expires timers at advancing time', function(done) {
	  var calls = [];
	  setTimeout(function() {
	    assert.deepEqual(calls, [1]);
	    done();
	  }, 1001);
	  
	  setTimeout(function() {
        calls.push(1);	  
	  }, 1000);
	  
	  Thoth.advanceTime(1001);
	});
	
	
  });
});