var assert = require("assert");
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");

describe('zurvan', function() {
  describe('while manages time', function() {
    beforeEach(function(done) {
	  zurvan.interceptTimers().then(done, done);
	});
	afterEach(function(done) {
	  zurvan.releaseTimers().then(done, done);
	});
	
	it('if no timeouts available, expiration of all does not advance time', function(done) {
	  var calls = [];
	  setInterval(function() {
	    calls.push(1);
	  }, 1000);
	  
	  assert.equal(0, process.uptime());
	  zurvan.expireAllTimeouts().then(function() {
	    assert.equal(0, process.uptime());
		assert.deepEqual([], calls);
	  }).then(done, done);
	});
	
	it('if no timers available, expiration of single one does not advance time', function(done) {
	  assert.equal(0, process.uptime());
	  zurvan.forwardTimeToNextTimer().then(function() {
	    assert.equal(0, process.uptime());
	  }).then(done, done);
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
	  
	  zurvan.expireAllTimeouts().then(function() {
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
	  
	  zurvan.expireAllTimeouts().then(function() {
	    assert.deepEqual([1,2,3,2], calls);
	  }).then(done, done);
	});
	
	it('takes into account timers and intervals when forwarding to next timer', function(done) {
	  var calls = [];
	  setImmediate(function() {
	    calls.push(1);
	  });
	  
	  setTimeout(function() {
	    calls.push(2);
		process.nextTick(function() {
		  calls.push(5);
		});
	  }, 500);
	  
	  setTimeout(function() {
	    calls.push(3);
        assert.equal(0.5, process.uptime());
	  }, 500);
	  
	  setInterval(function() {
	    calls.push(4);
		setImmediate(function() {
		  calls.push(6);
		});
	  }, 1000);
	  
	  zurvan.forwardTimeToNextTimer().then(function() {
	    assert.deepEqual([1,2,5,3], calls);
		return zurvan.forwardTimeToNextTimer();
	  }).then(function() {
	    assert.deepEqual([1,2,5,3,4,6], calls);
		return zurvan.forwardTimeToNextTimer();
	  }).then(function() {
	    assert.deepEqual([1,2,5,3,4,6,4,6], calls);
	  }).then(done, done);
	});
	
	it('clears all tasks in the microqueue before resolving', function(done) {
	
	  // queue priorities: 1. Promise 2. nextTick 3. setImmediate
	  var calls = [];
	  setTimeout(function() {
	    calls.push(1);
	    process.nextTick(function() {
		  calls.push(2);
	      process.nextTick(function() {
		    calls.push(3);
			process.nextTick(function() {
			  calls.push(4);
			  process.nextTick(function() {
			    calls.push(5);
				setImmediate(function() {
				  calls.push(6);
				  process.nextTick(function() {
				    calls.push(7);
					process.nextTick(function() {
					  calls.push(8);
					  process.nextTick(function() {
					    calls.push(9);
						setImmediate(function() {
						  calls.push(10);
						  setImmediate(function() {
						    calls.push(11);
							Promise.resolve().then(function() {
							  calls.push(12);
							}).then(function() {
							  calls.push(13);
							  return Promise.resolve();
							}).then(function() {
						      process.nextTick(function() {
							    calls.push(19);
								assert.equal(process.uptime(), 5);
							  })
							  calls.push(14);
							  return Promise.resolve();
							}).then(function() {
							  calls.push(15);
							}).then(function() {
							  calls.push(16)
							}).then(function() {
							  calls.push(17);
							  process.nextTick(function() {
							    calls.push(20);
							  });
							  return Promise.reject();
							}).catch(function() {
							  calls.push(18);
							  assert.equal(process.uptime(), 5);
							});
						  });
						});
					  });
					});
				  });
				});
			  });
			});
		  });
	    });
	  }, TimeUnit.seconds(5).toMilliseconds());
	  
	  zurvan.advanceTime(TimeUnit.seconds(10)).then(function() {
	    assert.equal(process.uptime(), 10);
		assert.deepEqual(calls, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
	  }).then(done, done);
	});
  });
});
