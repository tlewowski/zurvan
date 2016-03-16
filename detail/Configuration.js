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
    promiseScheduler: global.Promise    
  }
};

module.exports.merge = mergeConfigurations;
module.exports.defaultConfiguration = defaultConfiguration;