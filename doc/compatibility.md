## Engines

 _Zurvan_ is tested using Node.js: 0.10, 0.11, 0.12, 4.x, 5.x and newest releases. Currently there is no continous testing in the browser, thus it doesn't work, most probably.

## Libraries

Most libraries should work out of the box. Known problems will be listed below:

 - bluebird - _bluebird_, as a Promise library implements the <a href="https://promisesaplus.com/">A+ promises standard</a>.
 The standard leaves to implementer whether asynchronous actions (`Promise.resolve` and `Promise.reject`) are executed in macroqueue 
 (like `setImmediate` since Node.js 0.10) or in microqueue (like `process.nextTick` since Node.js 0.10). 
 
 Implementers of V8 engine picked up second option (microqueue), while _bluebird_ uses the first one (macroqueue). 
 Additionally, _bluebird_ buffers `setImmediate` on startup, and that means that it won't be using faked version. 