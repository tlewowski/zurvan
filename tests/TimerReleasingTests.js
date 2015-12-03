var zurvan = require("../zurvan");
var assert = require("assert");

describe('zurvan', function() {
  describe('after intercepting timers (basic functionality)', function() {
	it('expires timers at advancing time', function(done) {
      var calls = [];
	  zurvan.interceptTimers().then(function() {
	    setTimeout(function() {
	      assert.deepEqual(calls, [1]);
	    }, 1001);
	  
	    setTimeout(calls.push.bind(calls, 1), 1000);
		setInterval(calls.push.bind(calls, 2), 5);
		return zurvan.releaseTimers();
	  }).then(function(timers) {
	    assert.deepEqual([], calls);
		assert.equal(timers.timeouts.length, 2);
		assert.equal(timers.intervals.length, 1);
		assert.equal(timers.date.toISOString(), "1970-01-01T00:00:00.000Z");
		assert.deepEqual([0,0], timers.processTime);
		assert.equal(timers.currentTime.toSeconds(), 0);
		
		if(timers.timeouts[0].dueTime.isShorterThan(timers.timeouts[1].dueTime)) {
		  timers.timeouts[0].callback();
		  timers.timeouts[1].callback();
		}
		else {
		  timers.timeouts[1].callback();
		  timers.timeouts[0].callback();
		}
	  }).then(done, done);
	});
  });
});