var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var TimerInterceptor = require("./detail/TimerInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var DateInterceptor = require("./detail/DateInterceptor");
var TypeUtils = require("./detail/TypeUtils");
var APIHelper = require("./detail/APIHelper");
var TimeUnit = require("./TimeUnit");

var assert = require("assert");

function Zurvan() {
  this.timeForwardingOngoing = false;
  this.isStopped = false;
}

Zurvan.prototype.startTime = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(that.isStopped && !that.isExpiringEvents()) {
	  return resolve();
	}
	
	return reject(Error("Cannot start time during event expiration"));
  }).then(function() {
    that.isStopped = false;
    that.immediateInterceptor.restore();	
    that.processTimerInterceptor.restore();
    that.timerInterceptor.restore();
	that.dateInterceptor.restore();
  });
};

Zurvan.prototype.stopTime = function(config) {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(that.isStopped) {
	  return reject(Error("Cannot stop time that is already stopped"));
	}
	return resolve();
  }).then(function() {
    that.config = config || {};
    that.isStopped = true;
	that.setupTime(that.config.timeSinceStartup, that.config.systemTime);

    that.timerInterceptor = new TimerInterceptor(that, that.config);
    that.processTimerInterceptor = new ProcessTimerInterceptor(that);
    that.immediateInterceptor = new ImmediateInterceptor();	
	that.dateInterceptor = new DateInterceptor(that);
  });
  
};

Zurvan.prototype.setupTime = function(timeSinceStartup, systemTime) {
  if(TypeUtils.isNumber(timeSinceStartup)) {
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
  this.setSystemTimeTo(systemTime || 0);
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
  var advanceStep = (TypeUtils.isNumber(timeToForward)) ? TimeUnit.milliseconds(timeToForward) : timeToForward;  
  var that = this;
  return new Promise(function(resolve, reject) {
    if(advanceStep.isShorterThan(TimeUnit.milliseconds(0))) {
      reject("Even Zurvan cannot move back in time!");
    }

    if(that.isExpiringEvents()) {
      return reject(Error("Cannot forward time shortened previous forwarding ends. Currently at: " + 
	    that.currentTime.toMilliseconds() + " ms, target: " + that.targetTime.toMilliseconds() + " ms"));
    }

    that.targetTime = that.currentTime.extended(advanceStep);
  
    that.startExpiringEvents();
    setImmediate(function() {
	  advanceTimeHelper();
    });
  
    function advanceTimeHelper() {
      if(that.immediateInterceptor.areAwaiting()) {
        setImmediate(function() {
          advanceTimeHelper();
        });
        return;
      }
	
	  var closestTimer = that.timerInterceptor.nextTimer();
      if(closestTimer && !closestTimer.dueTime.isLongerThan(that.targetTime)) {
	    that.timerInterceptor.clearTimer(closestTimer.uid);
        that.currentTime.setTo(closestTimer.dueTime);
        setImmediate(function() {
  	      closestTimer.expire();
          advanceTimeHelper();
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

Zurvan.prototype.setSystemTimeTo = function(value) {
  if(TypeUtils.isString(value)) {
    value = new Date(value);
  }
  else if(TypeUtils.isNumber(value)) {
    value = new Date(value);
  }
  
  this.systemTimeOffset = value.getTime() - this.currentTime.toMilliseconds();
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

Zurvan.prototype.blockSystem = function(timeToBlock) {
  var blockStep = (TypeUtils.isNumber(timeToBlock)) ? TimeUnit.milliseconds(timeToBlock) : timeToBlock;  

  var that = this;  
  return new Promise(function(resolve, reject) {
    if(blockStep.isShorterThan(TimeUnit.milliseconds(0))) {
      return reject(Error("Even Zurvan cannot move back in time!"));
    }
	
	if(!that.isExpiringEvents()) {
	  assert(that.targetTime.isEqualTo(that.currentTime));
	  that.targetTime.add(blockStep);
	}
	else if(that.targetTime.isShorterThan(that.currentTime.extended(blockStep))) {
	  return reject(Error("Cannot block system during advancing for longer than requested advance time"));
	}
	
    that.currentTime.add(blockStep);
		
    var closestTimer = that.timerInterceptor.nextTimer();
    while(closestTimer && !closestTimer.dueTime.isLongerThan(that.currentTime)) {
      that.timerInterceptor.clearTimer(closestTimer.uid);
  	  setImmediate(closestTimer.expire.bind(closestTimer));
      closestTimer = that.timerInterceptor.nextTimer();
    }
	
  	resolve();
  }).then(function() {
    if(!that.isExpiringEvents()) {
      return that.waitForEmptyQueue();
	}
  });
};

Zurvan.prototype.waitForEmptyQueue = function() {
  return this.advanceTime(0);
};

function createZurvanAPI() {
  var apiFunctions = ["startTime", "stopTime", "advanceTime", 
    "blockSystem", "setSystemTimeTo", "expireAllTimeouts", 
	"forwardTimeToNextTimer", "waitForEmptyQueue"];
  
  return APIHelper.createAPI(new Zurvan(), apiFunctions);
}

module.exports = createZurvanAPI();