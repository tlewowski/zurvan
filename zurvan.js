var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var TimerInterceptor = require("./detail/TimerInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var DateInterceptor = require("./detail/DateInterceptor");
var TimeForwarder = require("./detail/TimeForwarder");
var TimeServer = require("./detail/TimeServer");
var APICreator = require("./detail/APICreator");
var Configuration = require("./detail/Configuration");

function enterRejectingState(actor) {
  actor.advanceTime = Promise.reject.bind(undefined, Error("Cannot advance time if timers are not intercepted!"));
  actor.blockSystem = Promise.reject.bind(undefined, Error("Cannot block system if timers are not intercepted!"));
  actor.expireAllTimeouts = Promise.reject.bind(undefined, Error("Cannot expire timeouts if timers are not intercepted!"));
  actor.forwardTimeToNextTimer = Promise.reject.bind(undefined, Error("Cannot forward time if timers are not intercepted!"));
}

function leaveRejectingState(actor) {
  actor.advanceTime = Zurvan.prototype.advanceTime;
  actor.blockSystem = Zurvan.prototype.blockSystem;
  actor.expireAllTimeouts = Zurvan.prototype.expireAllTimeouts;
  actor.forwardTimeToNextTimer = Zurvan.prototype.forwardTimeToNextTimer;
}

// me sad, but timeouts are global stuff :(
var areTimersIntercepted = false;

function Zurvan(config) { 
  this.globalConfig = config;
  this.timeServer = new TimeServer();
   
  this.immediateInterceptor = new ImmediateInterceptor();
  this.timerInterceptor = new TimerInterceptor(this.timeServer);
  
  this.timeForwarder = new TimeForwarder(this.timeServer, this.timerInterceptor, this.immediateInterceptor);
  
  this.processTimerInterceptor = new ProcessTimerInterceptor(this.timeServer);
  this.dateInterceptor = new DateInterceptor(this.timeServer);
  
  enterRejectingState(this);
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
    
    leaveRejectingState(that);	
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
    enterRejectingState(that);
  });
};

Zurvan.prototype.setSystemTime = function(newSystemTime) {
  return this.timeServer.setSystemTime(newSystemTime);
};

Zurvan.prototype.advanceTime = function(timeToForward) {
  return this.timeForwarder.advanceTime(timeToForward);
};

Zurvan.prototype.blockSystem = function(timeToBlock) {
  return this.timeForwarder.blockSystem(timeToBlock);	
};

Zurvan.prototype.expireAllTimeouts = function() {
  return this.timeForwarder.expireAllTimeouts();
};

Zurvan.prototype.forwardTimeToNextTimer = function() {
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