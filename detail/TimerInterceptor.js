"use strict";
var FieldOverrider = require("./FieldOverrider");
var TimerRepository = require("./TimerRepository");
var TypeChecks = require("./TypeChecks");
 
function Callback(f, args) {
  this.f = f;
  this.args = args;
}

Callback.prototype.call = function() {
  this.f.apply(undefined, this.args);
};

function TimerInterceptor(timeServer, timerType) {
  this.timeServer = timeServer;
  this.timerType = timerType;
}

TimerInterceptor.prototype.intercept = function(config, uidGenerator) {
  this.config = config;
  this.timerRepository = new TimerRepository(this.config, uidGenerator);
  this.setTimers = new FieldOverrider(this.timerType.context, this.timerType.setName, this.addTimer.bind(this, this.timerType.type));
  this.clearTimers = new FieldOverrider(this.timerType.context, this.timerType.clearName, this.clearTimer.bind(this));
};

TimerInterceptor.prototype.release = function() {
  this.setTimers.restore();
  this.clearTimers.restore();
  this.timerRepository.clearAll();
};

TimerInterceptor.prototype.nextTimer = function() {
  return this.timerRepository.nextTimer();
};

TimerInterceptor.prototype.lastTimer = function() {
  return this.timerRepository.lastTimer();
};

TimerInterceptor.prototype.createCallback = function(callback, args) {
  if(TypeChecks.isFunction(callback)) {
    return new Callback(callback, args);
  }
  
  if(this.config.acceptEvalTimers) {
    return new Callback(function() {return eval(callback);}, []);
  }
  
  throw new Error("Node.js does not accept strings in timers. If you wish, you can configure Zurvan to use them, but beware.");  
};

var MINIMUM_CALL_DELAY = 1;
TimerInterceptor.prototype.createCallDelay = function(requestedCallDelay) {
  if(!TypeChecks.isNumber(requestedCallDelay)) {
    if(this.config.denyImplicitTimer) {
      throw new Error("Call delay in timer call must be a numeric value");
	}
	
	return MINIMUM_CALL_DELAY;
  }
  
  if(requestedCallDelay < MINIMUM_CALL_DELAY) {
    if(this.config.denyTimersShorterThan1Ms) {
	  throw new Error("Call delay in timer must be >= " + MINIMUM_CALL_DELAY);
	}
	
	return MINIMUM_CALL_DELAY;
  }
  
  return requestedCallDelay;
};

TimerInterceptor.prototype.addTimer = function(TimerType, requestedCallback, requestedCallDelay) {
  var callback = this.createCallback(requestedCallback, [].splice.call(arguments, 3));
  var callDelay = this.createCallDelay(requestedCallDelay);
  
  var timer = new TimerType(callback, this.timerRepository, this.timeServer.currentTime, callDelay);
  return this.timerRepository.insertTimer(timer);
};

TimerInterceptor.prototype.clearTimer = function(uid) {
  return this.timerRepository.clearTimer(uid);
};

module.exports = TimerInterceptor;