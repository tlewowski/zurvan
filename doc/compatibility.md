## Engines

 _Zurvan_ is tested using Node.js: 0.11, 0.12, 4.0 and newest release of io.js. Currently there is no continous testing
 in the browser, thus it doesn't work, most probably.

## Libraries

Most libraries should work out of the box. Known problems will be listed below:

 - bluebird - _bluebird_, as a Promise library implements the <a href="https://promisesaplus.com/">A+ promises standard</a>.
 The standard leaves to implementer whether asynchronous actions (`Promise.resolve` and `Promise.reject`) are executed in macroqueue 
 (like `setImmediate` since Node.js 0.10) or in microqueue (like `process.nextTick` since Node.js 0.10). Implementers of V8 engine picked
 up second option (microqueue), while _bluebird_ uses the first one (macroqueue). Additionally, _bluebird_ buffers `setImmediate` on startup,
 and that means that it won't be using faked version. 
 By default _Zurvan_ is not compatible with _bluebird_, but compatibility may be enabled with `fakeOriginalSetImmediateMethods` configuration option.
 Be careful though - it may lead to some inconsistent behavior. If it does - check whether `bluebird` still calls scheduling in Node.js via `GlobalSetImmediate.call(...)`.
 If it doesn't, this workaround doesn't work anymore. For details of the configuration option, see <configuration.md>
 You can check out _bluebird_ library here: <https://github.com/petkaantonov/bluebird>