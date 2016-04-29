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
  this.timeServer = new TimeServer();
   
  this.immediateInterceptor = new ImmediateInterceptor();
  this.allTimersInterceptor = new AllTimersInterceptor(this.timeServer);
  
  this.timeForwarder = new TimeForwarder(this.timeServer, this.allTimersInterceptor, this.immediateInterceptor);
  
  this.processTimerInterceptor = new ProcessTimerInterceptor(this.timeServer);
  this.dateInterceptor = new DateInterceptor(this.timeServer);
  
  enterRejectingState(this);
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
      return newConfig.promiseScheduler.reject();
    });
  });
};

Zurvan.prototype.releaseTimers = function() {
  var that = this;
  return new that.config.promiseScheduler(function(resolve, reject) {
    if(zurvanActiveInstance !== that) {
      if(!zurvanActiveInstance) {
        return reject(new Error("Cannot release timers that were not intercepted by zurvan at all"));        
      }
      
      return reject(new Error("Cannot release timers that were intercepted by different instance of zurvan. Intercepted: " + 
        zurvanActiveInstance.interceptionStack));
    }
    return resolve();
  }).then(function() {
    return that.timeForwarder.stopForwarding();
  }).then(function() {
    return that.waitForEmptyQueue();
  }).then(function() {  
    var leftovers = {};
  
    if(!that.config.ignoreProcessTimers) {
      leftovers.processTime = that.processTimerInterceptor.release();
    }
    if(!that.config.ignoreDate) {
      leftovers.date = that.dateInterceptor.release();
    }
    that.immediateInterceptor.release();

    var toTimerAPI = function(timer) {
      return {
        dueTime: timer.dueTime,
        callDelay: timer.callDelay,
        callback: function() {
          return timer.callback.call();
        }
      };
    };
    var timers = that.allTimersInterceptor.release();
    leftovers.timeouts = timers.timeouts.map(toTimerAPI);
    leftovers.intervals = timers.intervals.map(toTimerAPI);
    leftovers.currentTime = that.timeServer.currentTime.copy();
    
    that.interceptionStack = undefined;
    zurvanActiveInstance = undefined;
    enterRejectingState(that);
    
    return leftovers;
  });
};

Zurvan.prototype.setSystemTime = function(newSystemTime) {
  return this.timeServer.setSystemTime(newSystemTime);
};

Zurvan.prototype.waitForEmptyQueue = function() {
  return this.advanceTime(0);
};

var apiFunctions = ["releaseTimers", "interceptTimers", "setSystemTime", "advanceTime", 
  "blockSystem", "expireAllTimeouts", "forwardTimeToNextTimer", "waitForEmptyQueue"];
  
function createZurvanAPI(newDefaultConfig) {
  var configuration = Configuration.merge(newDefaultConfig, Configuration.defaultConfiguration());
  var api = APICreator.createAPI(new Zurvan(configuration), apiFunctions);
  
  api.withDefaultConfiguration = function(config) {
    return createZurvanAPI(Configuration.merge(config, configuration));
  };
  
  return api;
}

module.exports = createZurvanAPI();