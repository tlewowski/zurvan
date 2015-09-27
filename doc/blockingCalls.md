## Why is `zurvan.blockSystem(time)` a synchronous action? Why doesn't it return a Promise, like the rest of the API?

It has to be - that's exactly what blocking actions are - synchronous calls that take a long time. 
No actions are executed in the event loop at the time of executing a blocking action - neither in the microqueue (`process.nextTick`, `Promise.resolve` and `Promise.reject` - at least in Node.js!), 
nor in macroqueue (`setImmediate`, `setTimeout`, `setInterval` - in Node.js). However, actions in the background (like timer expiration and putting them on the queue) is actually executed.
Since `zurvan.blockSystem(time)` is meant to simulate a blocking call, it has to be executed same way - and this means that it cannot return a `Promise`, as resolving it would clear event microqueue.

To read more about JS event queues, see: <https://html.spec.whatwg.org/multipage/webappapis.html#task-queue>