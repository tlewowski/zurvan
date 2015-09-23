var assert = require("assert");
var Zurvan = require("../Zurvan");
var TimeUnit = require("../TimeUnit");

describe('Zurvan', function() {
  describe('after stopping time', function(done) {
    beforeEach(function(done) {
	  Zurvan.stopTime().then(done, done);
	});
	afterEach(function(done) {
	  Zurvan.startTime().then(done, done);
	});
	it('supports any combination of setTimeout, setImmediate and process.nextTick', function(done) {
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
        calls.push(18);
	  }, 30);
	  
	  Zurvan.advanceTime(TimeUnit.milliseconds(30)).then(function() {
	    assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], calls);
		done();
	  });
	});
	
	it('supports arbitrary combination of sets/clears immediates/timeouts/intervals', function(done) {
	  var calls = [];
	  var knownHrtime;
	  var immediate1 = setImmediate(function() {
	    calls.push(1);
		clearImmediate(immediate2);
		clearTimeout(timeout1);
		clearInterval(interval1);
		
		var localInterval = setInterval(function() {
		  calls.push(8);
		  clearInterval(localInterval);	  
		}, 50);
		
		assert.equal(0, process.uptime());
	  });
	  
	  var immediate2 = setImmediate(function() {
	    calls.push(2);
	  });
	  
	  var timeout1 = setTimeout(function() {
	    calls.push(3);
	  }, 50);
	  
	  var timeout2 = setTimeout(function() {
	    calls.push(4);
		setImmediate(function() {
		  calls.push(10);
		  clearInterval(interval2);
		  
		  setTimeout(function() {
		    assert.deepEqual([1, 6, 100, 8, 4, 10], calls);
			assert.deepEqual([0, 150e6], process.hrtime(knownHrtime));
		  }, 100);
		});
	  }, 100);
	  
	  var interval1 = setInterval(function() {
	    calls.push(5);
	  }, 1);
	  
	  var interval2 = setInterval(function() {
	    calls.push(6);
		knownHrtime = process.hrtime();
		process.nextTick(function() {
		  calls.push(100);
		});
	  }, 50);
	  
	  Zurvan.advanceTime(200).then(done);
	});
	
	it('handles setImmediates and process.nextTick always properly', function(done) {
	  var calls = [];
	  
	  setImmediate(function() {
	    calls.push(0);
		setImmediate(function() {
		  process.nextTick(function() {
			calls.push(2);
			process.nextTick(function() {
			  calls.push(3);
		    });
		  });
		  calls.push(1);
		});
		
		process.nextTick(function() {
		  calls.push(0.5);
		});
		
		Zurvan.advanceTime(100).then(function() {
		  assert.deepEqual([0,0.5,1,2,3,4,5,6], calls);
		}).then(done, done);
	  });
	  
	  setTimeout(function() {
	    calls.push(4);
		process.nextTick(function() {
		  calls.push(5);
		});
		
		setImmediate(function() {
		  calls.push(6);
		});
	  }, 50);
	});
	
	it('can intersperse timeouts and immediates', function(done) {
	  var calls = [];
	  var immediate1 = setImmediate(function() {
	    calls.push(1);
	  });
	  
	  setImmediate(function() {
	    setImmediate(function() {
	      setImmediate(function() {
  	        calls.push(2);
	      });
	    });
	  });
	  
	  clearImmediate(immediate1);
	  clearImmediate(immediate1);
	  
	  setTimeout(function() {
	    assert.deepEqual([2], calls);
		done();
	  }, 200);
	  
	  Zurvan.advanceTime(200);
	});
  });
});