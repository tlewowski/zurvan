## Engines

 _Zurvan_ is tested using Node.js: 0.10, 0.11, 0.12, 4.x, 5.x and newest releases. Currently there is no continous testing in the browser, thus it doesn't work, most probably.

## Libraries

Most libraries should work out of the box. Known problems will be listed below:

 - bluebird - _bluebird_, as a Promise library implements the <a href="https://promisesaplus.com/">A+ promises standard</a>.
 The standard leaves to implementer whether asynchronous actions (`Promise.resolve` and `Promise.reject`) are executed in macroqueue 
 (like `setImmediate` since Node.js 0.10) or in microqueue (like `process.nextTick` since Node.js 0.10). 
 
 Implementers of V8 engine picked up second option (microqueue), while _bluebird_ uses the first one (macroqueue). 
 Additionally, _bluebird_ buffers `setImmediate` on startup, and that means that it won't be using faked version. 
 - unzip2 - _unzip2_ uses busy waiting for actual I/O, so in some cases it may look like `zurvan` freezes the testcases. Actual I/O is 
 not supported by `zurvan`, so integration with `unzip2` may be troublesome (especially that it actually hangs for small invalid files - https://github.com/glebdmitriew/node-unzip-2/issues/9)