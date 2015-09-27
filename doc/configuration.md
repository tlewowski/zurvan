## Configuration

`config` object passed as an argument to `zurvan.interceptTimers` may contain following fields:

 - `timeSinceStartup` - either `number` (seconds), array `[seconds, nanoseconds]`, or `TimeUnit` that represents time since process startup.
 First two options represent data returned by `process.uptime` and `process.hrtime`.
 - `systemTime` - a `Date`, `string` (string representation of Date) or `number` (timestamp), that sets starting values for `Date()` and `Date.now`.
 Behaves same as `zurvan.setSystemTime` call on the beginning.
 - `acceptEvalTimers` - a `boolean`. When `true`, `zurvan` will accept `setTimeout` and `setInterval` calls that require `eval` call, 
 i.e. ones that contain a `string` as first argument, instead of `function`. If `false`, will throw on such arguments.
 Default value is `false`, as Node.js doesn't accept such calls. It is recommended to keep it `false`.
 - `denyImplicitTimer` - a `boolean`. When `true`, `zurvan` will throw when `setTimeout` or `setInterval` is called without second, numeric
 argument that specifies delay. Default is `false`, as Node.js accepts them and sets delay to 0. It is recommended to set this value to `true`.
 - `ignoreProcessTimers - a `boolean`. When `true`, `process.uptime` and `process.hrtime` are not faked. By default `false`. It is recommended to 
 leave it `false`, unless you're trying to run `zurvan` in the browser.