"use strict";
var assert = require("assert");
var zurvan = require("../zurvan");

describe('zurvan', function() {
  describe('after intercepting timers', function() {
    beforeEach(function() {
	  return zurvan.interceptTimers();
	});
	
	afterEach(function() {
	  return zurvan.releaseTimers();
	});
	
	it('can handle complex scenarios on the queue in a single moment', function(done) {
	  var calls = [];
	  
	  setImmediate(function() {
	    calls.push(1);
		process.nextTick(function() {
		  calls.push(3);
		  process.nextTick(function() {
		    calls.push(5);
			setImmediate(function() {
			  calls.push(7);
			  process.nextTick(function() {
			    calls.push(11);
			  });
			});
            setImmediate(function() {
			  calls.push(8);
			  setImmediate(function() {
			    calls.push(15);
				process.nextTick(function() {
				  calls.push(18);
				});
			  });
			});
			setImmediate(function() {
			  calls.push(9);
			  process.nextTick(function() {
			    calls.push(12);
				process.nextTick(function() {
				  calls.push(13);
				  process.nextTick(function() {
				    calls.push(14);
					setImmediate(function() {
					  calls.push(17);
					});
				  });
				  setImmediate(function() {
				    calls.push(16);
				  });
				});
			  });
			});
		  });
		});
	  });
	  
	  zurvan.waitForEmptyQueue().then(function() {
	    assert.deepEqual(calls, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
	    assert.equal(process.uptime(), 0);
	  }).then(done, done);
	  
	  setImmediate(function() {
	    calls.push(2);
		process.nextTick(function() {
		  calls.push(4);
		  process.nextTick(function() {
		    calls.push(6);
			setImmediate(function() {
			  calls.push(10);
			});
		  });
		});
	  });
	});
  });
});