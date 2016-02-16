"use strict";
var Dependencies = require("./detail/Dependencies");

var missingDependencies = Dependencies.missing();
if(missingDependencies) {
  throw new Error(missingDependencies);
}

var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var AllTimersInterceptor = require("./detail/AllTimersInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var DateInterceptor = require("./detail/DateInterceptor");
var TimeForwarder = require("./detail/TimeForwarder");
var TimeServer = require("./detail/TimeServer");
var APICreator = require("./detail/APICreator");
var Configuration = require("./detail/Configuration");

function rejectPromiseWithError(errorMessage) {
  return function() {
    return Promise.reject(new Error(errorMessage));
  };
}

function enterRejectingState(actor) {
  actor.advanceTime = rejectPromiseWithError("Cannot advance time if timers are not intercepted by this instance of zurvan");
  actor.blockSystem = function() {
    throw new Error("Cannot block system if timers are not intercepted by this instance of zurvan");
  };
  actor.expireAllTimeouts = rejectPromiseWithError("Cannot expire timeouts if timers are not intercepted by this instance of zurvan");
  actor.forwardTimeToNextTimer = rejectPromiseWithError("Cannot forward time if timers are not intercepted by this instance of zurvan");
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
}

// me sad, but timeouts are global stuff :(
var areTimersIntercepted = false;

function Zurvan(config) { 
  this.globalConfig = config;
  this.timeServer = new TimeServer();
   
  this.immediateInterceptor = new ImmediateInterceptor();
  this.allTimersInterceptor = new AllTimersInterceptor(this.timeServer);
  
  this.timeForwarder = new TimeForwarder(this.timeServer, this.allTimersInterceptor, this.immediateInterceptor);
  
  this.processTimerInterceptor = new ProcessTimerInterceptor(this.timeServer);
  this.dateInterceptor = new DateInterceptor(this.timeServer);
  
  enterRejectingState(this);
}

Zurvan.prototype.interceptTimers = function(config) {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(areTimersIntercepted) {
	  return reject(new Error("Cannot intercept timers that are already intercepted by another instance of zurvan"));
	}
	return resolve();
  }).then(function() {
    return new Promise(function(resolve) {
      that.config = Configuration.merge(config, that.globalConfig);
      areTimersIntercepted = true;
	
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
	  var x = that.waitForEmptyQueue();
	  return x;
	}).catch(function() {
      if(!that.config.ignoreProcessTimers) {
        that.processTimerInterceptor.release();
	  }
	  if(!that.config.ignoreDate) {
    	that.dateInterceptor.release();
	  }
      that.immediateInterceptor.release();
	  that.allTimersInterceptor.release();

      areTimersIntercepted = false;
      enterRejectingState(that);
	  return Promise.reject();
    });
  });
};

Zurvan.prototype.releaseTimers = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(!areTimersIntercepted) {
      return reject(new Error("Cannot release timers that were not intercepted by this instance of zurvan"));
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
	
    areTimersIntercepted = false;
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

var defaultZurvanConfiguration = {
  timeSinceStartup: 0,
  systemTime: 0,
  acceptEvalTimers: false,
  denyImplicitTimer: false,
  denyTimersShorterThan1Ms: false,
  ignoreProcessTimers: false,
  ignoreDate: false,
  fakeOriginalSetImmediateMethods: false,
  throwOnInvalidClearTimer: false
};

var apiFunctions = ["releaseTimers", "interceptTimers", "setSystemTime", "advanceTime", 
  "blockSystem", "expireAllTimeouts", "forwardTimeToNextTimer", "waitForEmptyQueue"];
  
function createZurvanAPI(newDefaultConfig) {
  var configuration = Configuration.merge(newDefaultConfig, defaultZurvanConfiguration);
  var api = APICreator.createAPI(new Zurvan(configuration), apiFunctions);
  
  api.withDefaultConfiguration = function(config) {
    return createZurvanAPI(Configuration.merge(config, configuration));
  };
  
  return api;
}

module.exports = createZurvanAPI();