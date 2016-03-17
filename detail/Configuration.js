"use strict";
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
  var versionRegex = /v([0-9]+)\.([0-9]+)\.([0-9]+)/;
  var version = process.version.match(versionRegex);
  
  var Promise = global.Promise;
  if(version[1] === '0' && version[2] < '11') {
    try {
      Promise = require('bluebird');
      Promise.setScheduler(function() {
        return setImmediate.apply(global, [].splice.call(arguments, 0));
      })
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
    promiseScheduler: Promise    
  }
};

module.exports.merge = mergeConfigurations;
module.exports.defaultConfiguration = defaultConfiguration;