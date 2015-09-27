var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var TimerInterceptor = require("./detail/TimerInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var DateInterceptor = require("./detail/DateInterceptor");
var TypeChecks = require("./detail/TypeChecks");
var APICreator = require("./detail/APICreator");
var Configuration = require("./detail/Configuration");
var TimeUnit = require("./TimeUnit");

var assert = require("assert");

// me sad, but timeouts are global stuff :(
var areTimersIntercepted = false;


function Zurvan(config) {
  this.timeForwardingOngoing = false;
  this.isActiveInterceptor = false;
  this.globalConfig = config;
   
  this.timerInterceptor = new TimerInterceptor(this);
  this.immediateInterceptor = new ImmediateInterceptor();	
  this.dateInterceptor = new DateInterceptor(this);
  this.processTimerInterceptor = new ProcessTimerInterceptor(this);
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
	that.setupTime(that.config.timeSinceStartup, that.config.systemTime);
  
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
	
	if(that.isExpiringEvents()) {
	  return reject(Error("Cannot release timers during event expiration"));
	}
  
    return resolve();
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

Zurvan.prototype.setupTime = function(timeSinceStartup, systemTime) {
  if(TypeChecks.isNumber(timeSinceStartup)) {
    this.currentTime = TimeUnit.seconds(timeSinceStartup);
  }
  else if (timeSinceStartup && timeSinceStartup.length === 2){
    this.currentTime = TimeUnit.seconds(timeSinceStartup[0]).extended(TimeUnit.nanoseconds(timeSinceStartup[1]));
  }
  else {
    this.currentTime = TimeUnit.seconds(0);
	if(timeSinceStartup) {
	  this.currentTime.add(timeSinceStartup);
	}
  }
  
  this.targetTime = this.currentTime.copy();
  this.setSystemTime(systemTime || 0);
};

Zurvan.prototype.stopExpiringEvents = function() {
  this.timeForwardingOngoing = false;
};

Zurvan.prototype.startExpiringEvents = function() {
  this.timeForwardingOngoing = true;  
};

Zurvan.prototype.isExpiringEvents = function() {
  return this.timeForwardingOngoing;
};

Zurvan.prototype.advanceTime = function(timeToForward) {
  var advanceStep = (TypeChecks.isNumber(timeToForward)) ? TimeUnit.milliseconds(timeToForward) : timeToForward;  
  var that = this;
  return new Promise(function(resolve, reject) {
    if(advanceStep.isShorterThan(TimeUnit.milliseconds(0))) {
      return reject(Error("Even Zurvan cannot move back in time!"));
    }
	
	if(!that.isActiveInterceptor) {
	  return reject(Error("Cannot advance time if timers are not intercepted!"));
	}
	
    if(that.isExpiringEvents()) {
      return reject(Error("Cannot forward time shortened previous forwarding ends. Currently at: " + 
	    that.currentTime.toMilliseconds() + " ms, target: " + that.targetTime.toMilliseconds() + " ms"));
    }
	
    that.targetTime = that.currentTime.extended(advanceStep);
  
    that.startExpiringEvents();
    setImmediate(function() {
	  fireTimersOneByOne();
    });
  
    function fireTimersOneByOne() {
      if(that.immediateInterceptor.areAwaiting()) {
        setImmediate(function() {
          fireTimersOneByOne();
        });
        return;
      }
	
	  var closestTimer = that.timerInterceptor.nextTimer();
      if(closestTimer && !closestTimer.dueTime.isLongerThan(that.targetTime)) {
	    that.timerInterceptor.clearTimer(closestTimer.uid);
        that.currentTime.setTo(closestTimer.dueTime);
        setImmediate(function() {
  	      closestTimer.expire();
		 
		  // schedule on macroqueue, to make sure that all microqueue tasks already expired
		  // clearing macroqueue is handled in the beginning of this function
		  setImmediate(function() {
            fireTimersOneByOne();
		  });
        });
      }
	  else {
        that.currentTime.setTo(that.targetTime);
        that.stopExpiringEvents();
        resolve();
      }
    }
  });  
};

Zurvan.prototype.setSystemTime = function(value) {
  if(TypeChecks.isString(value)) {
    value = new Date(value);
  }
  else if(TypeChecks.isNumber(value)) {
    value = new Date(value);
  }
  
  this.systemTimeOffset = TimeUnit.milliseconds(value.getTime() - this.currentTime.toMilliseconds());
};

Zurvan.prototype.expireAllTimeouts = function() {
  var lastTimeout = this.timerInterceptor.lastTimeout();
  if(lastTimeout) {
    var that = this;
	return this.advanceTime(lastTimeout.dueTime.shortened(that.currentTime)).then(function() {
	  return that.expireAllTimeouts();
	});
  }

  return Promise.resolve();
};

Zurvan.prototype.forwardTimeToNextTimer = function() {
  var closestTimer = this.timerInterceptor.nextTimer();
  if(closestTimer) {
    return this.advanceTime(closestTimer.dueTime.shortened(this.currentTime));
  }
  
  return Promise.resolve();
};

Zurvan.prototype.fireAllOutdatedTimers = function() {
  var closestTimer = this.timerInterceptor.nextTimer();
  while(closestTimer && !closestTimer.dueTime.isLongerThan(this.currentTime)) {
    this.timerInterceptor.clearTimer(closestTimer.uid);
    setImmediate(closestTimer.expire.bind(closestTimer));
    closestTimer = this.timerInterceptor.nextTimer();
  }
}

Zurvan.prototype.blockSystem = function(timeToBlock) {
  var blockStep = (TypeChecks.isNumber(timeToBlock)) ? TimeUnit.milliseconds(timeToBlock) : timeToBlock;
 
  if(blockStep.isShorterThan(TimeUnit.milliseconds(0))) {
    throw new Error("Even Zurvan cannot move back in time!");
  }
	
  if(!this.isActiveInterceptor) {
	throw new Error("Cannot block system if timers are not intercepted!");
  }
	
  if(!this.isExpiringEvents()) {
	assert(this.targetTime.isEqualTo(this.currentTime));
    this.targetTime.add(blockStep);
  }
  else if(this.targetTime.isShorterThan(this.currentTime.extended(blockStep))) {
    throw new Error("Cannot block system during advancing for longer than requested advance time");
  }
	
  this.currentTime.add(blockStep);
  this.fireAllOutdatedTimers();
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

var apiFunctions = ["releaseTimers", "interceptTimers", "advanceTime", 
  "blockSystem", "setSystemTime", "expireAllTimeouts", 
  "forwardTimeToNextTimer", "waitForEmptyQueue"];


function createZurvanAPI(newDefaultConfig) {
  var configuration = Configuration.merge(newDefaultConfig, defaultZurvanConfiguration);
  var api = APICreator.createAPI(new Zurvan(configuration), apiFunctions);
  
  api.withDefaultConfiguration = function(config) {
    return createZurvanAPI(Configuration.merge(config, configuration));
  }
  
  return api;
}

module.exports = createZurvanAPI();