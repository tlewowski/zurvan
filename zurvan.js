var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var TimerInterceptor = require("./detail/TimerInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var DateInterceptor = require("./detail/DateInterceptor");
var TimeForwarder = require("./detail/TimeForwarder");
var TimeServer = require("./detail/TimeServer");
var TypeChecks = require("./detail/TypeChecks");
var APICreator = require("./detail/APICreator");
var Configuration = require("./detail/Configuration");
var TimeUnit = require("./TimeUnit");

var assert = require("assert");

// me sad, but timeouts are global stuff :(
var areTimersIntercepted = false;

function Zurvan(config) {
  this.isActiveInterceptor = false;
  this.globalConfig = config;
  this.timeServer = new TimeServer();
   
  this.immediateInterceptor = new ImmediateInterceptor();
  this.timerInterceptor = new TimerInterceptor(this.timeServer);
  this.timeForwarder = new TimeForwarder(this.timeServer, this.timerInterceptor, this.immediateInterceptor);
  
  this.processTimerInterceptor = new ProcessTimerInterceptor(this.timeServer);
  this.dateInterceptor = new DateInterceptor(this.timeServer);
}

Zurvan.prototype.interceptTimers = function(config) {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(areTimersIntercepted) {
	  return reject(Error("Cannot intercept timers that are already intercepted!"));
	}
	return resolve();
  }).then(function() {
    that.config = Configuration.merge(config, that.globalConfig);
    areTimersIntercepted = true;
	that.isActiveInterceptor = true;
	that.timeServer.setupTime(that.config.timeSinceStartup, that.config.systemTime);
  
    that.timerInterceptor.intercept(that.config);
    that.immediateInterceptor.intercept();	
    that.dateInterceptor.intercept();
	
	if(!that.config.ignoreProcessTimers) {
      that.processTimerInterceptor.intercept();
	}
	
	return that.waitForEmptyQueue();
  });
};

Zurvan.prototype.releaseTimers = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(!areTimersIntercepted) {
      return reject(Error("Cannot release timers that were not intercepted"));
	}
	
    return resolve();
  }).then(function() {
    return that.timeForwarder.stopForwarding();
  }).then(function() {
    return that.waitForEmptyQueue();
  }).then(function() {
  	if(!that.config.ignoreProcessTimers) {
      that.processTimerInterceptor.release();
	}
	
	that.dateInterceptor.release();
    that.immediateInterceptor.release();
	that.timerInterceptor.release();

    areTimersIntercepted = false;
	that.isActiveInterceptor = false;
  });
};

Zurvan.prototype.setSystemTime = function(newSystemTime) {
  return this.timeServer.setSystemTime(newSystemTime);
};

Zurvan.prototype.advanceTime = function(timeToForward) {
  if(!this.isActiveInterceptor) {
	  return Promise.reject(Error("Cannot advance time if timers are not intercepted!"));
  }
  
  return this.timeForwarder.advanceTime(timeToForward);
};

Zurvan.prototype.blockSystem = function(timeToBlock) {
  if(!this.isActiveInterceptor) {
	throw new Error("Cannot advance time if timers are not intercepted!");
  }
  
  return this.timeForwarder.blockSystem(timeToBlock);	
};

Zurvan.prototype.expireAllTimeouts = function() {
  if(!this.isActiveInterceptor) {
	throw new Error("Cannot advance time if timers are not intercepted!");
  }
  
  return this.timeForwarder.expireAllTimeouts();
};

Zurvan.prototype.forwardTimeToNextTimer = function() {
  if(!this.isActiveInterceptor) {
	throw new Error("Cannot advance time if timers are not intercepted!");
  }
  
  return this.timeForwarder.forwardTimeToNextTimer();
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
  ignoreProcessTimers: false
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