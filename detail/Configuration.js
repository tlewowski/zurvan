"use strict";

var NodeVersion = require("./utils/NodeVersion");
var TypeChecks = require("./utils/TypeChecks");
var TimeUnit = require("../TimeUnit");

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
	denyTimersLongerThanInt32: false,
    ignoreProcessTimers: false,
    ignoreDate: false,
    fakeOriginalSetImmediateMethods: false,
    throwOnInvalidClearTimer: false,
    promiseScheduler: Promise,
	requestedCyclesAroundSetImmediateQueue: 4,
	maxAllowedSetImmediateBatchSize: 500,
	fakeNodeDedicatedTimers: true,
	rejectOnCallbackFailure: false
  };
}

function requestBoolean (name) {
	return function(config) {
		if(!TypeChecks.isBoolean(config[name])) {
		    return 'required ' + name + ' to be a boolean (given: ' + config[name] + ')';
		}
	};
}

function requestPositiveInteger (name) {
	return function(config) {
		if(!TypeChecks.isInteger(config[name]) || config[name] <= 0) {
			return 'required ' + name + ' to be a positive integer (given: ' + config[name] + ')';
		}
	};
}

var validators = [
  function negativeTimeSinceStartup(config) {
	  if(TypeChecks.isNumber(config.timeSinceStartup) && config.timeSinceStartup < 0) {
		  return 'if timeSinceStartup is a number, it has to be >= 0 (given: ' + config.timeSinceStartup + ')';
	  }

	  if(!TypeChecks.isNumber(config.timeSinceStartup) && 
	    !Array.isArray(config.timeSinceStartup) &&
		!TimeUnit.isInstance(config.timeSinceStartup)) {
		  return 'timeSinceStartup has to be either a non-negative number, instance of TimeUnit or ' +
		    'an array of two positive numbers (given: ' + config.timeSinceStartup + ')';
	  }

	  if(Array.isArray(config.timeSinceStartup)) {
		  if(config.timeSinceStartup.length != 2) {
			  return 'timeSinceStartup as array must contain exactly two elements (given length: ' + config.timeSinceStartup.length + ')';
		  }
		  if(config.timeSinceStartup.filter(function(x) { return !TypeChecks.isNumber(x) || x < 0; }).length > 0) {
			  return 'timeSinceStartup as array must contain two positive numbers (given: ' + config.timeSinceStartup + ')';
		  }
	  }
  },
  requestBoolean('acceptEvalTimers'),
  requestBoolean('denyImplicitTimer'),
  requestBoolean('denyTimersShorterThan1Ms'),
  requestBoolean('denyTimersLongerThanInt32'),
  requestBoolean('ignoreProcessTimers'),
  requestBoolean('ignoreDate'),
  requestBoolean('throwOnInvalidClearTimer'),
  requestBoolean('fakeNodeDedicatedTimers'),
  requestBoolean('rejectOnCallbackFailure'),
  requestPositiveInteger('maxAllowedSetImmediateBatchSize'),
  requestPositiveInteger('requestedCyclesAroundSetImmediateQueue'),
  function(config) {
    if(isNaN(new Date(config.systemTime).getTime())) {
		return 'systemTime must be an argument of new Date resulting in valid date (given: ' + config.systemTime + ')';
	}
  }
];

function validate(config) {
	return validators
	  .map(function(validator) { return validator(config); })
	  .filter(function(x) { return x; });
}

module.exports.merge = mergeConfigurations;
module.exports.defaultConfiguration = defaultConfiguration;
module.exports.validate = validate;