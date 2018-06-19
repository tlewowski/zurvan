'use strict';
var assert = require('assert');
var TimeUnit = require('../TimeUnit');
var zurvan = require('../zurvan');

function scheduleDelayedChange(x) {
  setImmediate(function() {
    setImmediate(function() {
      setImmediate(function() {
        setImmediate(function() {
          setImmediate(function() {
            setImmediate(function() {
              x.x = true;
            });
          });
        });
      });
    });
  });
}

describe('zurvan', function() {
  describe('while manages time', function() {
    beforeEach(function() {
      return zurvan.interceptTimers();
    });
    afterEach(function() {
      return zurvan.releaseTimers();
    });

    it('if no timeouts available, expiration of all does not advance time', function(done) {
      var calls = [];
      setInterval(function() {
        calls.push(1);
      }, 1000);

      assert.equal(0, process.uptime());
      zurvan
        .expireAllTimeouts()
        .then(function() {
          assert.equal(0, process.uptime());
          assert.deepEqual([], calls);
        })
        .then(done, done);
    });

    it('if no timeouts available, expiration still clears the queue', function() {
      var x = {};
      scheduleDelayedChange(x);
      return zurvan.expireAllTimeouts().then(function() {
        assert(x.x);
      });
    });

    it('if no timers available, expiration of single one does not advance time', function() {
      assert.equal(0, process.uptime());
      return zurvan.forwardTimeToNextTimer().then(function() {
        assert.equal(0, process.uptime());
      });
    });

    it('if no timeouts available, expiration still clears the queue', function() {
      var x = {};
      scheduleDelayedChange(x);
      return zurvan.forwardTimeToNextTimer().then(function() {
        assert(x.x);
      });
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

      zurvan
        .expireAllTimeouts()
        .then(function() {
          assert.deepEqual([0, 1, 2], calls);
          assert.equal(1, process.uptime());
        })
        .then(done, done);
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

      zurvan
        .expireAllTimeouts()
        .then(function() {
          assert.deepEqual([1, 2, 3, 2], calls);
        })
        .then(done, done);
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

      zurvan
        .forwardTimeToNextTimer()
        .then(function() {
          assert.deepEqual([1, 2, 5, 3], calls);
          return zurvan.forwardTimeToNextTimer();
        })
        .then(function() {
          assert.deepEqual([1, 2, 5, 3, 4, 6], calls);
          return zurvan.forwardTimeToNextTimer();
        })
        .then(function() {
          assert.deepEqual([1, 2, 5, 3, 4, 6, 4, 6], calls);
        })
        .then(done, done);
    });
  });
});
