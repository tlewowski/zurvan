"use strict";

var NodeVersion = require("./utils/NodeVersion");

function mergeConfigurations(localConfiguration, globalConfiguration) {
  var finalConfiguration = {};
  
  Object.keys(globalConfiguration).forEach(function(key) {
    finalConfiguration[key] = globalConfiguration[key];
  });
  
  if(localConfiguration !== undefined) {
    Object.keys(localConfiguration).forEach(function(key) {
      finalConfiguration[key] = localConfiguration[key];
    });
  }

  return finalConfiguration;
}

function defaultConfiguration() {
  var Promise = global.Promise;
  if(!Promise) {
    try {
      Promise = require('bluebird');
      Promise.setScheduler(function() {
        return global.setImmediate.apply(global, [].splice.call(arguments, 0));
      });
    }
    catch(err) {}
  }
  
  return {
    timeSinceStartup: 0,
    systemTime: 0,
    acceptEvalTimers: false,
    denyImplicitTimer: false,
    denyTimersShorterThan1Ms: false,
    ignoreProcessTimers: false,
    ignoreDate: false,
    fakeOriginalSetImmediateMethods: false,
    throwOnInvalidClearTimer: false,
    promiseScheduler: Promise,
	requestedCyclesAroundSetImmediateQueue: 4,
	maxAllowedSetImmediateBatchSize: 500
  };
}

module.exports.merge = mergeConfigurations;
module.exports.defaultConfiguration = defaultConfiguration;