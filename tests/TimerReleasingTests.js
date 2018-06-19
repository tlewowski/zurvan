var zurvan = require('../zurvan');
var TimeUnit = require('../TimeUnit');

var assert = require('assert');

describe('zurvan', function() {
  describe('after intercepting timers and rejecting them', function() {
    it('returns current state of the world', function(done) {
      var calls = [];
      zurvan
        .interceptTimers()
        .then(function() {
          setTimeout(function() {
            assert.deepEqual(calls, [1]);
          }, 1001);

          setTimeout(calls.push.bind(calls, 1), 1000);
          setInterval(calls.push.bind(calls, 2), 5);
          return zurvan.releaseTimers();
        })
        .then(function(leftovers) {
          assert.deepEqual([], calls);
          assert.equal(leftovers.timeouts.length, 2);
          assert.equal(leftovers.intervals.length, 1);
          assert.equal(
            leftovers.date.toISOString(),
            '1970-01-01T00:00:00.000Z'
          );
          assert.deepEqual([0, 0], leftovers.processTime);
          assert.equal(leftovers.currentTime.toSeconds(), 0);

          assert.equal(1000, leftovers.timeouts[0].dueTime.toMilliseconds());
          leftovers.timeouts[0].callback();
          leftovers.timeouts[1].callback();

          assert.equal(5, leftovers.intervals[0].dueTime.toMilliseconds());
          assert.equal(5, leftovers.intervals[0].callDelay.toMilliseconds());
        })
        .then(done, done);
    });

    it('returns state of the world after time', function(done) {
      var calls = [];
      zurvan
        .interceptTimers()
        .then(function() {
          setTimeout(calls.push.bind(calls, 1), 1000);
          setTimeout(calls.push.bind(calls, 2), 2000);
          return zurvan.advanceTime(TimeUnit.seconds(1.5));
        })
        .then(function() {
          assert.deepEqual([1], calls);
          return zurvan.releaseTimers();
        })
        .then(function(leftovers) {
          assert.deepEqual([1], calls);
          assert.equal(leftovers.timeouts.length, 1);
          assert.equal(leftovers.intervals.length, 0);
          assert.equal(
            leftovers.date.toISOString(),
            '1970-01-01T00:00:01.500Z'
          );
          assert.deepEqual([1, 5e8], leftovers.processTime);
          assert.equal(leftovers.currentTime.toSeconds(), 1.5);
          assert.equal(leftovers.timeouts[0].dueTime.toSeconds(), 2);
          leftovers.timeouts[0].callback();
          assert.deepEqual([1, 2], calls);
        })
        .then(done, done);
    });
  });
});
