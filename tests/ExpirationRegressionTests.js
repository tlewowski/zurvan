"use strict";
var zurvan = require("../zurvan");
var TimeUnit = require ("../TimeUnit");
var assert = require("assert");
var NodeVersion = require("../detail/utils/NodeVersion");
var bluebird = require("bluebird");

var Promise = global.Promise;
if(!Promise) {
  Promise = bluebird;
}

describe('zurvan had a problem', function() {
  it('advanceTime did not clear all tasks in the microqueue before resolving - that is regression for it', function() {
    var calls = [];
	  return zurvan.interceptTimers().then(function() {
      // queue priorities: 1. Promise 2. nextTick 3. setImmediate
      setTimeout(function() {
        calls.push(1);
        process.nextTick(function() {
          calls.push(2);
          process.nextTick(function() {
            calls.push(3);
            process.nextTick(function() {
            calls.push(4);
              process.nextTick(function() {
              calls.push(5);
              setImmediate(function() {
                calls.push(6);
                process.nextTick(function() {
                  calls.push(7);
                  process.nextTick(function() {
                    calls.push(8);
                    process.nextTick(function() {
                      calls.push(9);
                      setImmediate(function() {
                        calls.push(10);
                        setImmediate(function() {
                          calls.push(11);
                          Promise.resolve()
                            .then(function() {
                              calls.push(12);
                            }).then(function() {
                              calls.push(13);
                              return Promise.resolve();
                            }).then(function() {
                              process.nextTick(function() {
                                calls.push(19);
                                assert.equal(process.uptime(), 5);
                              });
                              calls.push(14);
                              return Promise.resolve();
                            }).then(function() {
                              calls.push(15);
                            }).then(function() {
                              calls.push(16);
                            }).then(function() {
                              calls.push(17);
                              process.nextTick(function() {
                                calls.push(20);
                              });
                              return Promise.reject();
                            }).catch(function() {
                              calls.push(18);
                              assert.equal(process.uptime(), 5);
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      }, TimeUnit.seconds(5).toMilliseconds());
      
      return zurvan.advanceTime(TimeUnit.seconds(10));
    }).then(function() {
      assert.equal(process.uptime(), 10);
      assert.deepEqual(calls, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]);
      return zurvan.releaseTimers();
    });
  });
  
  // event loop goes like this: timers & intervals, process.nextTick, I/O, process.nextTick, 
  // setImmediate, process.nextTick - in bunches. so if immediates started, they'll execute till the end
  
  var callOrder = NodeVersion.features.hasPromise ? [1,2,3,4,5,6,7,8,9,10,11] : [1,3,4,2,5,6,7,8,9,11,10];
  ticksFromImmediatesTestcase("bluebird", bluebird, callOrder)
  if(NodeVersion.features.hasPromise) {
    ticksFromImmediatesTestcase("native Promise", global.Promise, callOrder)    
  }
  
  function ticksFromImmediatesTestcase(name, scheduler, expectedCallOrder) {
    it('with scheduler: ' + name + ' ticks from immediates scheduled before waitForQueue requests were not executed', function() {
      var calls = [];
      
      return zurvan.interceptTimers({promiseScheduler: scheduler, bluebird: bluebird}).then(function() {
        setImmediate(function() {
          calls.push(1);
          process.nextTick(function() {
            calls.push(3);
            setImmediate(function() {
              calls.push(5);
            });
            process.nextTick(function() {
              calls.push(4);
            });
            setImmediate(function() {
              calls.push(6);
              process.nextTick(function() {
                calls.push(7);
                setImmediate(function() {
                  calls.push(8);
                  setImmediate(function() {
                    calls.push(9);
                    process.nextTick(function() {
                      calls.push(11);
                    });
                  });
                  setImmediate(function() {
                    calls.push(10);
                  });
                });
              });
            });
          });
        });
        setImmediate(function() {
          calls.push(2);
        });
        
        return zurvan.waitForEmptyQueue();	  
      }).then(function() {
        assert.deepEqual(calls, expectedCallOrder);
        return zurvan.releaseTimers();
      });
    });
  }
});