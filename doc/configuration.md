## Configuration

`config` object passed as an argument to `zurvan.interceptTimers` may contain following fields:

 - `timeSinceStartup` - either `number` (seconds), array `[seconds, nanoseconds]`, or `TimeUnit` that represents time since process startup.
 First two options represent data returned by `process.uptime` and `process.hrtime`.
 - `systemTime` - a `Date`, `string` (string representation of Date) or `number` (timestamp), that sets starting values for `Date()` and `Date.now`.
 Behaves same as `zurvan.setSystemTime` call on the beginning.
 - `acceptEvalTimers` - a `boolean`. When `true`, `zurvan` will accept `setTimeout` and `setInterval` calls that require `eval` call,
 i.e. ones that contain a `string` as first argument, instead of `function`. If `false`, will throw on such arguments. `setImmediate` is *not* supervised.
 Default value is `false`, as Node.js doesn't accept such calls. It is recommended to keep it `false`.
 - `denyImplicitTimer` - a `boolean`. When `true`, `zurvan` will throw when `setTimeout` or `setInterval` is called without second, numeric
 argument that specifies delay. Default is `false`, as Node.js accepts them and sets delay to 1. It is recommended to set this value to `true` to catch some mistakes during testing.
 - `denyTimersShorterThan1Ms` - a `boolean`. When `true`, `zurvan` will throw when `setTimeout` or `setInterval` is invoked with second argument that is a number smaller than 1.
 Default value is `false` and typical Node.js behavior is used (setting delay to 1 ms). It is recommended to set this value to `true`, to catch some mistakes during testing.
 - `ignoreProcessTimers` - a `boolean`. When `true`, `process.uptime` and `process.hrtime` are not faked. By default `false`. It is recommended to 
 leave it `false`, unless you're trying to run `zurvan` in the browser.
 - `ignoreDate` - a `boolean`. When `true`, original `Date` is replaced by one adjusted to time as forwarded by `zurvan`. If `false`, original one is still used. By default `true`, it is recommended to keep it so, unless
 you need exactly the behavior of `Date` (see <a href="../README.md#limitations">limitations</a> of current behavior)
 - `bluebird` - an `object`, representing _bluebird_ library (returned from `require('bluebird')`)
 - `throwOnInvalidClearTimer` - a `boolean`. When `true` calls to `clearImmediate`, `clearTimeout` and `clearInterval` will throw when called with an argument 
  that was not earlier returned by respective `set` function (i.e. `clearTimeout` throws when argument was not returned by `setTimeout`,
  `clearInterval` throws when argument was not returned by `setInterval` and `clearImmediate` throws when argument was not returned by `setImmediate`). 
 By default `false`, it is recommended to set to `true` to provide better test assertions.
 - `promiseScheduler` - a `function` representing a Promises/A+ compatible library (e.g., `bluebird`). It will be used internally to schedule Promises. 
 By default it is the built-in Node.js Promise. In environments where there is no Promise, `bluebird` is used as default library (if available). If neither
 of these options are available, `.interceptTimers()` will throw an error.