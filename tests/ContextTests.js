'use strict';
var zurvan = require('../zurvan');
var TimeUnit = require('../TimeUnit');
var assert = require('assert');

function globalTimersUntouched(originalTimers) {
  assert.strictEqual(originalTimers.setTimeout, setTimeout);
  assert.strictEqual(originalTimers.setInterval, setInterval);
  assert.strictEqual(originalTimers.setImmediate, setImmediate);
  assert.strictEqual(originalTimers.clearTimeout, clearTimeout);
  assert.strictEqual(originalTimers.clearInterval, clearInterval);
  assert.strictEqual(originalTimers.clearImmediate, clearImmediate);
}

function globalProcessUntouched(originalProcess) {
  assert.strictEqual(originalProcess.uptime, process.uptime);
  assert.strictEqual(originalProcess.hrtime, process.hrtime);
}

function globalDateUntouched(originalDate) {
  assert.strictEqual(originalDate, Date);
}

function globalContextUntouched(originalValues) {
  globalTimersUntouched(originalValues.timers);
  globalProcessUntouched(originalValues.process);
  globalDateUntouched(originalValues.Date);
}

describe('zurvan context', function() {
  var globalValues = {};

  beforeEach(function() {
    globalValues = {
      timers: {
        setTimeout: setTimeout,
        setInterval: setInterval,
        setImmediate: setImmediate,
        clearTimeout: clearTimeout,
        clearInterval: clearInterval,
        clearImmediate: clearImmediate
      },
      process: {
        uptime: process.uptime,
        hrtime: process.hrtime
      },
      Date: Date
    };
  });

  afterEach(function() {
    globalValues = {};
  });

  it('is global by default', function() {
    return zurvan
      .interceptTimers()
      .then(function() {
        assert.notStrictEqual(globalValues.timers.setTimeout, setTimeout);
        assert.notStrictEqual(globalValues.timers.setInterval, setInterval);
        assert.notStrictEqual(globalValues.timers.setImmediate, setImmediate);
        assert.notStrictEqual(globalValues.timers.clearTimeout, clearTimeout);
        assert.notStrictEqual(globalValues.timers.clearInterval, clearInterval);
        assert.notStrictEqual(
          globalValues.timers.clearImmediate,
          clearImmediate
        );
        assert.notStrictEqual(globalValues.process.uptime, process.uptime);
        assert.notStrictEqual(globalValues.process.hrtime, process.hrtime);
        assert.notStrictEqual(globalValues.Date, Date);
        return zurvan.releaseTimers();
      })
      .then(function() {
        globalContextUntouched(globalValues);
      });
  });
});
