'use strict';
var assert = require('assert');
var zurvan = require('../zurvan');
var TimeUnit = require('../TimeUnit');
var TimersForPolicyTesting = require('./helpers/TimersForPolicyTesting');

describe('zurvan schedules timers at same dueTime', function() {
  function expectOrdering(name, policyName, expectedCalls) {
    it(name, function() {
      var calls = [];
      return zurvan
        .interceptTimers(
          policyName ? { timerExpirationPolicy: policyName } : undefined
        )
        .then(function() {
          TimersForPolicyTesting.setTestTimers(calls);
          return zurvan.expireAllTimeouts();
        })
        .then(function() {
          assert.deepEqual(calls, expectedCalls);
          return zurvan.releaseTimers();
        });
    });
  }

  expectOrdering('by default in FIFO order', undefined, [
    1,
    2,
    3,
    4,
    5,
    6,
    2,
    5,
    7,
    2,
    5
  ]);
  expectOrdering('in FIFO order as required', 'FIFO', [
    1,
    2,
    3,
    4,
    5,
    6,
    2,
    5,
    7,
    2,
    5
  ]);
  expectOrdering(
    'can expire timeouts first in FIFO order',
    'Timeouts-First-FIFO',
    [1, 3, 4, 2, 5, 6, 2, 5, 7, 2, 5]
  );
  expectOrdering(
    'can expire intervals first in FIFO order',
    'Intervals-First-FIFO',
    [2, 5, 1, 3, 4, 2, 5, 6, 2, 5, 7]
  );
});
