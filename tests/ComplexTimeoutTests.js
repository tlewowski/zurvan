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
	it('supports any combination of setTimeout, setImmediate and process.nextTick is supported', function(done) {
	  var calls = [];
	  process.nextTick(function() {
	    calls.push(1);
		setImmediate(function() {
		  calls.push(3);
		  setTimeout(function() {
		    calls.push(7);
			setImmediate(function() {
			  calls.push(9);
			});
			process.nextTick(function() {
			  calls.push(8);
			});
		  }, 10);
		});
	  });
	  
	  setImmediate(function() {
	    calls.push(2);
		setTimeout(function(a, b, c, d) {
		  calls.push(a);
		  process.nextTick(function() {
		    calls.push(b);
			setTimeout(function() {
			  calls.push(d);
			}, 1);
		  });
		  setImmediate(function() {
		    calls.push(c);
		  });
		}, 20, 10, 11, 12, 13);
		
		setImmediate(function() {
		  calls.push(4);
		  setImmediate(function() {
		    calls.push(6);
		  });
		  process.nextTick(function() {
		    calls.push(5);
		  });
		});
	  });
	  
	  setTimeout(function() {
	    calls.push(14);
		setImmediate(function() {
		  calls.push(15);
		  setImmediate(function() {
		    calls.push(16);
			process.nextTick(function() {
			  calls.push(17);
			});
		  });
		});
	  }, 30);
	  
	  setTimeout(function() {
        assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], calls);
		done();
	  }, 30);
	  
	  Thoth.advanceTime(30);
	});
  });
});