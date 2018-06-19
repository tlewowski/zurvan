'use strict';
var assert = require('assert');
var zurvan = require('../zurvan');

describe('zurvan', function() {
  describe('after intercepting timers (basic functionality)', function() {
    beforeEach(function() {
      return zurvan.interceptTimers();
    });
    afterEach(function() {
      return zurvan.releaseTimers();
    });

    it('expires timers at advancing time', function() {
      var calls = [];
      setTimeout(function() {
        assert.deepEqual(calls, [1]);
      }, 1001);

      setTimeout(calls.push.bind(calls, 1), 1000);

      return zurvan.advanceTime(1001);
    });

    it('calls both timeouts and intervals', function() {
      var calls = [];
      setInterval(function() {
        calls.push(1);
        setTimeout(calls.push.bind(calls, 2), 10);
      }, 10);

      setTimeout(function() {
        calls.push(5);
      }, 41);

      return zurvan.advanceTime(42).then(function() {
        assert.deepEqual([1, 1, 2, 1, 2, 1, 2, 5], calls);
      });
    });

    it('calls intervals in cycle', function() {
      var calls = [];
      setInterval(calls.push.bind(calls, 1), 100);

      setTimeout(function() {
        calls.push(4);
      }, 410);

      return zurvan.advanceTime(410).then(function() {
        assert.deepEqual([1, 1, 1, 1, 4], calls);
      });
    });

    it('expires timers in order of dueTime', function() {
      var calls = [];
      setTimeout(calls.push.bind(calls, 1), 50);

      setTimeout(function() {
        calls.push(2);
      }, 1000);

      return zurvan.advanceTime(1500).then(function() {
        assert.equal(process.uptime(), 1.5);
        assert.deepEqual(calls, [1, 2]);
      });
    });

    it('calls immediates before timeouts', function() {
      var calls = [];
      setImmediate(function() {
        calls.push(1);
        setImmediate(calls.push.bind(calls, 4));
      });

      setTimeout(function() {
        calls.push(2);
        setImmediate(function() {
          calls.push(3);
        });
        setTimeout(function() {
          calls.push(45);
        }, 50);
      }, 50);

      return zurvan.advanceTime(100).then(function() {
        assert.deepEqual([1, 4, 2, 3, 45], calls);
      });
    });
  });
});
