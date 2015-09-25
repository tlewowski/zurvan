# Zurvan [![Build Status](https://travis-ci.org/Lewerow/zurvan.svg?branch=master)](https://travis-ci.org/Lewerow/zurvan)
[![Code Climate](https://codeclimate.com/github/Lewerow/Zurvan/badges/gpa.svg)](https://codeclimate.com/github/Lewerow/Zurvan)
[![Test Coverage](https://codeclimate.com/github/Lewerow/Zurvan/badges/coverage.svg)](https://codeclimate.com/github/Lewerow/Zurvan/coverage)
[![Dependencies](https://david-dm.org/Lewerow/zurvan.svg)](https://github.com/Lewerow/zurvan/blob/master/package.json)
[![devDependencies](https://david-dm.org/Lewerow/zurvan/dev-status.svg)](https://david-dm.org/Lewerow/zurvan#info=devDependencies)
[![GitHub version](https://badge.fury.io/gh/Lewerow%2Fzurvan.svg)](http://badge.fury.io/gh/Lewerow%2Fzurvan)

_Zurvan_ is an asynchronous library for faking whole real-time dependency of node.js, mainly for test purposes.

## Introduction
_Zurvan_ includes fake implementations for `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, 
`Date.now`, `Date`, `process.uptime` and `process.hrtime`. Also several other functions are taken into account,
such as `setImmediate`, `clearImmediate` and `process.nextTick`, but they are not faked - library utilizes asynchronous
execution heavily (under assumption that since time is asynchronous by default, it's better to leave this feature).

## API overview

### `zurvan`

This is the main module of the library. Typical forwarding of time is done step by step:

1. Event queue is cleared (all immediates and ticks are executed)
2. Nearest timer is inspected - if it is after due time (now + requested advance), time is set to requested due time and forwarding ends
3. Otherwise a single nearest timer is expired, and the 1. is applied again, with smaller reqested advance time

`zurvan.blockSystem` is an exception, described below.

#### `zurvan.interceptTimers(config)`

Library setup. Causes timers to be intercepted, i.e. all required functions are overridden after this call.
Returns a Promise that is resolved when timers are faked and event queue is empty and rejected if interception was not possible (e.g. timers were already intercepted)
It takes an optional configuration object as parameter. Details of configuration options are described in detailed <a href="doc/configuration.md">configuration documentation</a>.

#### `zurvan.releaseTimers()`

Library teardown. Causes timers to be restored, i.e. all original functions are set back. 
Returns a Promise that is resolved when timers are faked and event queue is empty and rejected if interception was not possible (e.g. timers were already intercepted)

#### `zurvan.advanceTime(timeToAdvance)`

Returns a `Promise` that is resolved when time is forwarded by given time and all timers with this dueTime are expired.

Argument may be either a number (it is then interpreted as millisecond) or a `TimeUnit` object.

#### `zurvan.blockSystem(blockingTime)`

Simulates a blocking call - expires all timers up to due time at once, without actually executing them (during expiration).

Returns a Promise that is resolved when the calls are finally executed, and entire event queue is clear.

#### `zurvan.setSystemTime(newSystemTime)`

Sets values returned by `new Date` and `Date.now` at given point of time (returned values will be of course adjusted with advancing time).

#### `zurvan.expireAllTimeouts()`

Forwards time up to the point when there is no timeout set any more. Intervals will remain.

*Warning!* Under certain circumstances this function may result in an infinite loop. Example:
```
function f() {
  setTimeout(f, 100);
}
```

Returns a `Promise` that is resolved when all timeouts are already called;

#### `zurvan.forwardTimeToNextTimer()`

Returns a `Promise` that is resolved when time is forwarded to nearest timer and all timers with this dueTime are expired.

#### `zurvan.waitForEmptyQueue()`

Returns a `Promise` that is resolved when all immediates are already called. Also timers with zero time will become expired;

### TimeUnit

A utility module providing time calculations that are - hopefully - more human-readable than operating on milliseconds everywhere.
Provide factory functions for `TimeUnit` object, that represents time duration:
 - `nanoseconds`
 - `microseconds`
 - `milliseconds`
 - `seconds`
 - `minutes`
 - `hours`
 - `days`
 - `weeks`
 
`TimeUnit` has the following API methods:
 - `unit.extended(unit2)` - returns duration represented by sum of durations of `unit` and `unit2`
 - `unit.shortened(unit2)` - returns duration represented by difference of durations between `unit` and `unit2`
 - `unit.add(unit2)` - mutator. Equal to `unit.setTo(unit.extended(unit2))`
 - `unit.subtract(unit2)` - mutator. Equal to `unit.setTo(unit.shortened(unit2))`
 - `unit.setTo(unit2)` - sets `unit` duration to be equal to duration of `unit2`
 - `unit.copy()` - creates a deep copy of `unit`
 - `unit.isShorterThan(unit2)` - checks if `unit` represents shorter duration than `unit2`
 - `unit.isLongerThan(unit2)` - checks if `unit` represents longer duration than `unit2`
 - `unit.isEqualTo(unit2)` - checks if both `unit` and `unit2` represent same duration, within a reasonable epsilon (current resolution is 10^-15 second)
 
All of them work only on `TimeUnit` objects, but work smoothly on cross-unit basis.
 
## Examples

For now, please refer to `tests` directory.

## Other

_Zurvan_ is available as package on NPM

Name is taken after babilonian deity of infinite time, Zurvan. For more details see: https://en.wikipedia.org/wiki/Zurvanism

If you encouter a bug when using _Zurvan_, please report it as an issue on GitHub. Of course, if you are willing to issue a pull request, they are welcome.

