"use strict";
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");

var assert = require("assert");

function wrongConfigurationExample(name, msg, config) {
	return it(name, function(done) {
	    try {
			zurvan.interceptTimers(config)
			  .then(function() {
				return zurvan.releaseTimers();
			  }, function() {
				return zurvan.releaseTimers();
			  }).then(function() {
				done(new Error("shouldn't allow invalid configuration: " + name));
			  }, function(){
				done(new Error("shouldn't allow invalid configuration: " + name));
			  });
		}
		catch(err) {
			console.log(err.message);
			assert(new RegExp(msg).test(err.message));
			done();
		}
	});
}

describe('zurvan throws at wrong configuration, like ', function() {
  wrongConfigurationExample('negative timeSinceStartup', 
    'if timeSinceStartup is a number, it has to be >= 0', 
	{ timeSinceStartup: -10 }
  );
  wrongConfigurationExample('timeSinceStartup not a number',
    'timeSinceStartup has to be either a non-negative number, instance of TimeUnit or an array of two positive numbers',
	{ timeSinceStartup: "alamakota" }
  );
  wrongConfigurationExample('timeSinceStartup as array must contain exactly two elements',
    'timeSinceStartup as array must contain exactly two elements',
	{ timeSinceStartup: [1, 2, 3] }
  );
  wrongConfigurationExample('timeSinceStartup not numeric array',
    'timeSinceStartup as array must contain two positive numbers',
	{ timeSinceStartup: ["a", 21] }
  );
  wrongConfigurationExample('not-boolean acceptEvalTimers',
    'required acceptEvalTimers to be a boolean',
	{ acceptEvalTimers: 0 }
  );
  wrongConfigurationExample('not-boolean denyTimersShorterThan1Ms',
    'required denyTimersShorterThan1Ms to be a boolean',
	{ denyTimersShorterThan1Ms  : 'stuffz' }
  );
  wrongConfigurationExample('not-boolean denyTimersLongerThanInt32',
    'required denyTimersLongerThanInt32 to be a boolean',
	{ denyTimersLongerThanInt32  : [] }
  );
  wrongConfigurationExample('not-boolean ignoreProcessTimers',
    'required ignoreProcessTimers to be a boolean',
	{ ignoreProcessTimers : {} }
  );
  wrongConfigurationExample('not-boolean ignoreDate',
    'required ignoreDate to be a boolean',
	{ ignoreDate : "ignorant" }
  );
  wrongConfigurationExample('not-boolean throwOnInvalidClearTimer',
    'required throwOnInvalidClearTimer to be a boolean',
	{ throwOnInvalidClearTimer: 500 }
  );
  wrongConfigurationExample('not-boolean fakeNodeDedicatedTimers',
    'required fakeNodeDedicatedTimers to be a boolean',
	{ fakeNodeDedicatedTimers: 321321 }
  );
  wrongConfigurationExample('not-boolean rejectOnCallbackFailure',
    'required rejectOnCallbackFailure to be a boolean',
	{ rejectOnCallbackFailure : "" }
  );
  wrongConfigurationExample('zero requestedCyclesAroundSetImmediateQueue',
    'required requestedCyclesAroundSetImmediateQueue to be a positive integer',
	{ requestedCyclesAroundSetImmediateQueue: 0 } 
  );
  wrongConfigurationExample('negative requestedCyclesAroundSetImmediateQueue',
    'required requestedCyclesAroundSetImmediateQueue to be a positive integer',
	{ requestedCyclesAroundSetImmediateQueue: -5 } 
  );
  wrongConfigurationExample('non-number maxAllowedSetImmediateBatchSize',
    'required maxAllowedSetImmediateBatchSize to be a positive integer',
	{ maxAllowedSetImmediateBatchSize: [500] } 
  );
  wrongConfigurationExample('floating maxAllowedSetImmediateBatchSize',
    'required maxAllowedSetImmediateBatchSize to be a positive integer',
	{ maxAllowedSetImmediateBatchSize: 5.5 } 
  );
  wrongConfigurationExample('systemTime undefined',
    'systemTime must be an argument of new Date resulting in valid date',
	{ systemTime: "unknown" }
  );
  wrongConfigurationExample('systemTime NaN',
    'systemTime must be an argument of new Date resulting in valid date',
	{ systemTime: NaN }
  ); 
});