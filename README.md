# Zurvan 

[![Build Status](https://travis-ci.org/Lewerow/zurvan.svg?branch=master)](https://travis-ci.org/Lewerow/zurvan)
[![Code Climate](https://codeclimate.com/github/Lewerow/Zurvan/badges/gpa.svg)](https://codeclimate.com/github/Lewerow/Zurvan)
[![Test Coverage](https://codeclimate.com/github/Lewerow/Zurvan/badges/coverage.svg)](https://codeclimate.com/github/Lewerow/Zurvan/coverage)
[![Dependencies](https://david-dm.org/Lewerow/zurvan.svg)](https://github.com/Lewerow/zurvan/blob/master/package.json)
[![devDependencies](https://david-dm.org/Lewerow/zurvan/dev-status.svg)](https://david-dm.org/Lewerow/zurvan#info=devDependencies)
[![GitHub version](https://badge.fury.io/gh/Lewerow%2Fzurvan.svg)](http://badge.fury.io/gh/Lewerow%2Fzurvan)
[![npm version](https://badge.fury.io/js/zurvan.svg)](http://badge.fury.io/js/zurvan)

_Zurvan_ is an asynchronous library for faking whole real-time dependency of node.js, mainly for test purposes.

## Introduction
_Zurvan_ includes fake implementations for `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, 
`Date.now`, `Date`, `process.uptime` and `process.hrtime`. Also several other functions are taken into account,
such as `setImmediate`, `clearImmediate` and `process.nextTick`, but they are not faked - library utilizes asynchronous
execution heavily (under assumption that since time is asynchronous by default, it's better to leave it this way).

_Zurvan_ is currently *not* tested in the browser, so if you want to use it there, you can either hack it yourself (see: [Zurvan requirements](#requirements)) or a
contact me.

Multiple testcases cannot be ran in parallel when using _Zurvan_, as there is only a single time stream for forwarding.

_Zurvan_ will *NOT* work properly (at least in release 0.2.1) if test code uses real I/O (filesystem, sockets etc.).
To be exact, `waitForEmptyQueue` will not be able to work, since there will be no scheduled tasks on the queue, despite the fact that I/O is not done.
It is possible to use _Zurvan_ in such cases, but additional `Promise`s are required. It is generally preferred to use preloaded data and mock I/O via 
usual async actions (`setImmediate/process.nextTick`).

## API overview

### `zurvan`

This is the main module of the library. Typical forwarding of time is done step by step:

1. Event queue is cleared (all immediates and ticks are executed)
2. Nearest timer is inspected - if it is after due time (now + requested advance), time is set to requested due time and forwarding ends
3. Otherwise a single nearest timer is expired, and the 1. is applied again, with smaller reqested advance time

`zurvan.blockSystem` is an exception, described below.

#### `zurvan.interceptTimers([config])`

Library setup. Causes timers to be intercepted, i.e. all required functions are overridden after this call.
Returns a Promise that is resolved when timers are faked and event queue is empty and rejected if interception was not possible (e.g. timers were already intercepted)
It takes an optional configuration object as parameter, which takes precedence over global configuration. 
Details of configuration options are described in <a href="doc/configuration.md">configuration documentation</a>.

Resolution value is `undefined` and rejection `Error` with proper message.

#### `zurvan.releaseTimers()`

Library teardown. Causes timers to be restored, i.e. all original functions are set back. 
Returns a Promise that is resolved when timers are faked and event queue is empty and rejected if interception was not possible (e.g. timers were already intercepted)

Resolution value is and `object`, defined as: 
``` 
{
  timeouts: remainingTimeouts,
  intervals: remainingIntervals,
  date: zurvanEndDate,
  processTime: zurvanEndProcessTime,
  currentTime: zurvanEndTime
}
```
these fields are defined as:

 - `remainingTimeouts` is an array of `Timer` objects, representing timeouts that did not expire yet
 - `remainingIntervals` is an array of `Timer` objects, representing intervals that did not expire yet
 - `zurvanEndDate` is _zurvan_ date in same format that is returned when timers are intercepted (not exactly same as usual `Date` - see [limitations]{#limitations})
 - `zurvanEndProcessTime` is _zurvan_ process time in `hrtime` format (`[seconds, nanoseconds]`) at the release site
 - `zurvanEndTime` is `TimeUnit` that can be compared with `dueTime` of `Timer`. It represents amount of time that was forwarded.
 
 A `Timer` object consists of at least two fields: `callback` which is a 0-argument function executing what would be done if it expired and
 `dueTime` which is a `TimeUnit`, informing when would the timer be expired. It may also contain arbitrary other fields.
 Order of elements in `remainingTimeouts` and `remainingIntervals` is undefined.
 
 If is rejected, rejection value is `Error` with proper message.

#### `zurvan.withDefaultConfiguration(config)`

Returns a new library object (new `zurvan` instance) with modified default configuration. 
This means that after calling `.withDefaultConfiguration`, there are two instances of `zurvan`. However, they should not be used in parallel,
i.e. only one of them should intercept timers at the same time. If another one already does, promise returned by `interceptTimers` will be rejected.
Chain of `withDefaultConfiguration(config)` causes all `config`s to be merged (newer configurations override their fields, rest is taken from previous).

Configuration options are described in <a href="doc/configuration.md">configuration documentation</a>.

#### `zurvan.advanceTime(timeToAdvance)`

Returns a `Promise` that is resolved when time is forwarded by given time and all timers with this dueTime are expired,
or rejected it time cannot be forwarded (e.g. timers were not intercepted yet).
Resolution value is `undefined` and rejection `Error` with proper message.

Argument may be either a number (it is then interpreted as millisecond) or a `TimeUnit` object.

#### `zurvan.blockSystem(blockingTime)`

Simulates a blocking call - expires *synchronously* all timers up to due time at once, without actually executing them (during expiration).
Argument may be either a number (it is then interpreted as millisecond) or a `TimeUnit` object.

To read about why is this function needed, and why does it require a synchronous API, see: <a href="doc/blockingCalls.md">blocking calls explaination</a>.

Does not return anything. Throws if time cannot be forwarded (e.g. timers were not intercepted yet).

#### `zurvan.setSystemTime(newSystemTime)`

Sets values returned by `new Date` and `Date.now` at given point of time (returned values will be of course adjusted with advancing time).
Argument is expected to be "castable" to `Date` - this means a `Date` object, `string` which is valid argument to `Date.parse` or `number` (which is then treated as timestamp).

#### `zurvan.expireAllTimeouts()`

Advances time up to the point when there is no timeout set any more. Intervals will remain.

*Warning!* Under certain circumstances this function may result in an infinite loop. Example:
```
function f() {
  setTimeout(f, 100);
}
```

Returns a `Promise` that is resolved when all timeouts are already called or rejected it time cannot be forwarded (e.g. timers were not intercepted yet).
Resolution value is `undefined` and rejection `Error` with proper message.

#### `zurvan.forwardTimeToNextTimer()`

Forwards the time to the nearest timer and exipires all timers with same due time.
Resolution value is `undefined` and rejection `Error` with proper message.

Returns a `Promise` that is resolved when all callbacks are executed and event queue is empty or rejected it time cannot be forwarded (e.g. timers were not intercepted yet)..

#### `zurvan.waitForEmptyQueue()`

Returns a `Promise` that is resolved when all immediates are already called or rejected it time cannot be forwarded (e.g. timers were not intercepted yet).
Also timers with zero time will be expired.
Resolution value is `undefined` and rejection `Error` with proper message.

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
 
All of them work only on `TimeUnit` objects, but work smoothly on cross-unit basis. They do not take into account phenomenons such as leap seconds.
This is also the reason why units like `month` and `year` are not provided - because they would be ambigous and complicate the utility. To handle the calendar properly
much bigger library would need to be used.
 
### Other
There are no other API functions. All functions and modules in `detail` directory are library internal and are not guaranteed to expose a stable set of methods. Please do not use them directly.
If you do - do it at your own risk. But if you do, and you find any of these functions useful (which I doubt - that's why they are in `detail`), contact me to make it part of stable API.

## <a name="limitations"></a> Limitations

After intercepting timers, `Date` object is overridden (if `noDateInterception` configuration option is set to `false`). As a result, some external calls that rely on types may fail.
This is because for `var d = new Date()` call `Object.prototype.toString(d)` without `zurvan` will return `[object Date]`, and after timer interception, `[object Object]`.
Please file an issue if this poses a problem for you.

## Examples

For now, please refer to `tests` directory for executable examples.

## <a name="requirements"></a> Requirements

Obviously, JavaScript environment is much bigger than just Node.js, and you might need to fake timers in other environments, such as the browser.
If you do, your environment has to fulfill several requirements:

 - implement at least ECMAScript 5 (ES6 is better)
 - have a basic implementation of promises (ES6 promises are sufficient or any basically compatible library - be careful though. Promises shall be implemented as microqueue tasks, or at least scheduled by global `setImmediate` - otherwise, 
`zurvan` has to be started (not loaded - started. timers have to be intercepted) _before_ promise library in _every_ module they both occur. Additionally, promise library alone cannot be required by any file evaluated before first one requiring _zurvan_)
For compatibility options with specific libraries (e.g. <a href="https://www.npmjs.com/package/bluebird">bluebird</a>), see: <a href="doc/compatibility.md">compatibility options</a>
 - implement `setImmediate/clearImmediate` - they *cannot* be implemented as wrappers over `setTimeout/clearTimeout`, at least for now.
 - implement `process.uptime` and `process.hrtime` - if it doesn't, _Zurvan_ has to be ran with compatibility option: `ignoreProcessTimers: true`

See <a href="doc/configuration.md">configuration documentation</a> to check out possible compatibility options (e.g. evaluating strings in `setTimeout`)
Of course, if you have trouble with running _Zurvan_ on your custom target, feel free to contact me for support
Be careful about scheduling - some asynchronous features used by browsers (such as `MutationObserver`, `postMessage`, `requestAnimationFrame`) are not faked by `zurvan`. Since this is only a time-faking library, it fakes only time-based async actions.
Additionally, `Promise.resolve` and `Promise.reject` are both specified to be executed asynchronously, but engine implementation is free to use either microqueue or macroqueue. Additionally, if it doesn't use API functions (`setImmediate`) for 
scheduling macroqueue tasks, then there will be cases where _Zurvan_ won't behave correctly. Currently there are no such known cases for Node.js - and if they will be found, they are a bug and shall be fixed.

If you're trying to run on Node.js older than 0.10 - you will have trouble, as in these Nodes `setImmediate` was not implemented and `process.nextTick` was used to handle the macroqueue. However, 
`process.nextTick` is not a function faked by `zurvan`. Again - contact me if you need support.

## Other

_Zurvan_ is available as package on NPM

Name is taken after babilonian deity of infinite time, _Zurvan_. For more details see: <https://en.wikipedia.org/wiki/Zurvanism>

If you encouter a bug when using _Zurvan_, please report it as an issue on GitHub. Of course, if you are willing to issue a pull request, they are welcome.
