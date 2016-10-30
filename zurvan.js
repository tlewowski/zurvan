"use strict";
var Dependencies = require("./detail/Dependencies");

var missingStartupDependencies = Dependencies.missingAtStartup();
if(missingStartupDependencies) {
  throw new Error(missingStartupDependencies);
}

var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var AllTimersInterceptor = require("./detail/AllTimersInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var DateInterceptor = require("./detail/DateInterceptor");
var TimeForwarder = require("./detail/TimeForwarder");
var TimeServer = require("./detail/TimeServer");
var APICreator = require("./detail/utils/APICreator");
var Configuration = require("./detail/Configuration");

function rejectPromiseWithError(errorMessage, promiseScheduler) {
  return function() {
    return promiseScheduler.reject(new Error(errorMessage));
  };
}

function enterRejectingState(actor) {
  actor.timeForwarder.disable();
  actor.advanceTime = rejectPromiseWithError("Cannot advance time if timers are not intercepted by this instance of zurvan", actor.config.promiseScheduler);
  actor.blockSystem = function() {
    throw new Error("Cannot block system if timers are not intercepted by this instance of zurvan");
  };
  actor.expireAllTimeouts = rejectPromiseWithError("Cannot expire timeouts if timers are not intercepted by this instance of zurvan", actor.config.promiseScheduler);
  actor.forwardTimeToNextTimer = rejectPromiseWithError("Cannot forward time if timers are not intercepted by this instance of zurvan", actor.config.promiseScheduler);
}

function sequentialScenario(zurvan, scenarioSteps) {
  return scenarioSteps.reduce(function(prevStep, currStep) {
    return prevStep.then(function(args){
	  return currStep(zurvan, args);
	});
  }, zurvan.config.promiseScheduler.resolve());
}

function enterForwardingState(actor) {
  actor.advanceTime = function(timeToForward) {
    return this.timeForwarder.advanceTime(timeToForward);
  };
  actor.blockSystem = function(timeToBlock) {
    return this.timeForwarder.blockSystem(timeToBlock);  
  };
  actor.expireAllTimeouts = function() {
    return this.timeForwarder.expireAllTimeouts();
  };
  actor.forwardTimeToNextTimer = function() {
    return this.timeForwarder.forwardTimeToNextTimer();
  };
  actor.timeForwarder.enable(actor.config);
}

// me sad, but timeouts are global stuff :(
// it may be modified in future, but I doubt it
var zurvanActiveInstance;

function Zurvan(config) { 
  this.globalConfig = config;
  this.config = this.globalConfig;
  this.resetSubcomponents();
  enterRejectingState(this);
}

Zurvan.prototype.resetSubcomponents = function() {
  this.timeServer = new TimeServer();
   
  this.immediateInterceptor = new ImmediateInterceptor();
  this.allTimersInterceptor = new AllTimersInterceptor(this.timeServer);
  
  this.timeForwarder = new TimeForwarder(this.timeServer, this.allTimersInterceptor, this.immediateInterceptor);
  
  this.processTimerInterceptor = new ProcessTimerInterceptor(this.timeServer);
  this.dateInterceptor = new DateInterceptor(this.timeServer);
}

Zurvan.prototype.interceptTimers = function(config) {
  var newConfig = Configuration.merge(config, this.globalConfig);

  // this error has to be synchronous, since we do not know yet whether the system supports Promises
  var missingRuntimeDependencies = Dependencies.missingAtIntercept(newConfig);
  if(missingRuntimeDependencies) {
    throw new Error(missingStartupDependencies);
  }

  var interceptionStack = new Error().stack;
  var that = this;
  return new newConfig.promiseScheduler(function(resolve, reject) {
      if(zurvanActiveInstance) {
        return reject(new Error("Cannot intercept timers that are already intercepted by another instance of zurvan. Intercepted: " + 
          zurvanActiveInstance.interceptionStack));
      }
      return resolve();
    }).then(function() {
      return new newConfig.promiseScheduler(function(resolve) {
        that.config = newConfig;
        that.interceptionStack = interceptionStack;
        zurvanActiveInstance = that;
  
        that.timeServer.setupTime(that.config.timeSinceStartup, that.config.systemTime);
        if(!that.config.ignoreDate) {
          that.dateInterceptor.intercept();
        }
    
        that.immediateInterceptor.intercept(that.config);  
  
        if(!that.config.ignoreProcessTimers) {
          that.processTimerInterceptor.intercept();
        }

      that.allTimersInterceptor.intercept(that.config);
      enterForwardingState(that);
      resolve();
    }).then(function() {
      return that.waitForEmptyQueue();
    }).catch(function(err) {
      if(!that.config.ignoreProcessTimers) {
        that.processTimerInterceptor.release();
      }
      if(!that.config.ignoreDate) {
        that.dateInterceptor.release();
      }
      that.immediateInterceptor.release();
      that.allTimersInterceptor.release();

      zurvanActiveInstance = undefined;
      enterRejectingState(that);
      return newConfig.promiseScheduler.reject(err);
    });
  });
};

function validateReleasingTimers(zurvan) {
    return new zurvan.config.promiseScheduler(function(resolve, reject) {
		if(zurvanActiveInstance !== zurvan) {
		  if(!zurvanActiveInstance) {
			return reject(new Error("Cannot release timers that were not intercepted by zurvan at all"));        
		  }
		  
		  return reject(new Error("Cannot release timers that were intercepted by different instance of zurvan. Intercepted: " + 
			zurvanActiveInstance.interceptionStack));
		}
		return resolve();
	});
}

function gatherLeftovers(zurvan) {
    var leftovers = {};
  
    leftovers.immediates = zurvan.immediateInterceptor.release();
    if(!zurvan.config.ignoreProcessTimers) {
      leftovers.processTime = zurvan.processTimerInterceptor.release();
    }
    if(!zurvan.config.ignoreDate) {
      leftovers.date = zurvan.dateInterceptor.release();
    }
	
    var toTimerAPI = function(timer) {
      return {
        dueTime: timer.dueTime,
        callDelay: timer.callDelay,
        callback: function() {
          return timer.callback.call();
        }
      };
    };
    var timers = zurvan.allTimersInterceptor.release();
    leftovers.timeouts = timers.timeouts.map(toTimerAPI);
    leftovers.intervals = timers.intervals.map(toTimerAPI);
    leftovers.currentTime = zurvan.timeServer.currentTime.copy();
    
    zurvan.interceptionStack = undefined;
    zurvanActiveInstance = undefined;
    enterRejectingState(zurvan);
    
    return leftovers;
}

var releaseSteps = [
  validateReleasingTimers, 
  function(zurvan){return zurvan.timeForwarder.stopForwarding();},
  function(zurvan){return zurvan.waitForEmptyQueue();},
  gatherLeftovers
];

var forcedReleaseSteps = [
  validateReleasingTimers, 
  gatherLeftovers,
  function(zurvan, leftovers) {
    zurvan.resetSubcomponents(); 
	return leftovers;
  }
];

Zurvan.prototype.releaseTimers = function() {
  return sequentialScenario(this, releaseSteps);
}
Zurvan.prototype.forcedReleaseTimers = function() {
  return sequentialScenario(this, forcedReleaseSteps);
}

Zurvan.prototype.setSystemTime = function(newSystemTime) {
  return this.timeServer.setSystemTime(newSystemTime);
};

Zurvan.prototype.waitForEmptyQueue = function() {
  return this.advanceTime(0);
};

var apiFunctions = ["releaseTimers", "interceptTimers", "setSystemTime", "advanceTime", 
  "blockSystem", "expireAllTimeouts", "forwardTimeToNextTimer", "waitForEmptyQueue", "forcedReleaseTimers"];
  
function createZurvanAPI(newDefaultConfig) {
  var configuration = Configuration.merge(newDefaultConfig, Configuration.defaultConfiguration());
  var api = APICreator.createAPI(new Zurvan(configuration), apiFunctions);
  
  api.withDefaultConfiguration = function(config) {
    return createZurvanAPI(Configuration.merge(config, configuration));
  };
  
  return api;
}

module.exports = createZurvanAPI();