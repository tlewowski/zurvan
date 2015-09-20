var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var TimerInterceptor = require("./detail/TimerInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var assert = require("assert");

function Thoth() {
}

Thoth.prototype.startTime = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(!that.isExpiringEvents()) {
	  resolve();
	}
	else {
	  reject(Error("Cannot start time during event expiration"));
	}
  }).then(function() {
    that.immediateInterceptor.restore();	
    that.processTimerInterceptor.restore();
    that.timerInterceptor.restore();
  });
};

Thoth.prototype.stopTime = function() {
  this.timerInterceptor = new TimerInterceptor(this);
  this.processTimerInterceptor = new ProcessTimerInterceptor(this);
  this.immediateInterceptor = new ImmediateInterceptor();

  this.currentTime = {milliseconds: 0, nanoseconds: 0};
  this.targetTime = {milliseconds: 0, nanoseconds: 0};
  this.timeForwardingOngoing = false;
};

Thoth.prototype.stopExpiringEvents = function() {
  this.timeForwardingOngoing = false;
};

Thoth.prototype.startExpiringEvents = function() {
  this.timeForwardingOngoing = true;  
};

Thoth.prototype.isExpiringEvents = function() {
  return this.timeForwardingOngoing;
};

Thoth.prototype.advanceTime = function(timeToForward) {
  
  var that = this;
  return new Promise(function(resolve, reject) {
    if(timeToForward < 0) {
      reject("Even Thoth cannot move back in time!");
    }

    if(that.currentTime.milliseconds !== that.targetTime.milliseconds) {
      reject(Error("Cannot forward time before first forwarding ends. Currently at: " + 
	    that.currentTime.milliseconds + " ms, target: " + that.targetTime.milliseconds + " ms"));
    }

    that.targetTime.milliseconds = that.currentTime.milliseconds + timeToForward;
  
    if(!that.isExpiringEvents()) {
      that.startExpiringEvents();
      setImmediate(function() {
        advanceTimeHelper();
      });
    }
  
    function advanceTimeHelper() {
      if(that.immediateInterceptor.areAwaiting()) {
        setImmediate(function() {
          advanceTimeHelper();
        });
        return;
      }
	
	  var closestTimer = that.timerInterceptor.next();
      if(closestTimer && closestTimer.dueTime <= that.targetTime.milliseconds) {
	    that.timerInterceptor.clearTimer(closestTimer.uid);
        that.currentTime.milliseconds = closestTimer.dueTime;	  
        setImmediate(function() {
  	      closestTimer.expire();
          advanceTimeHelper();
        });
      }
	  else {
        that.currentTime.milliseconds = that.targetTime.milliseconds;
        that.stopExpiringEvents();
		resolve();
      }
    }
  });  
};

Thoth.prototype.blockSystem = function(timeToBlock) {

  var that = this;  
  return new Promise(function(resolve, reject) {
    if(timeToBlock < 0) {
      reject(Error("Even Thoth cannot move back in time!"));
    }
	
	if(!that.isExpiringEvents()) {
	  assert(that.targetTime.milliseconds === that.currentTime.milliseconds);
	  that.targetTime.milliseconds += timeToBlock;
	}
	
    that.currentTime.milliseconds += timeToBlock;
	
    var closestTimer = that.timerInterceptor.next();
    while(closestTimer && closestTimer.dueTime <= that.currentTime.milliseconds) {
      that.timerInterceptor.clearTimer(closestTimer.uid);
  	  setImmediate(closestTimer.expire.bind(closestTimer));
      closestTimer = that.timerInterceptor.next();
    }
	
  	resolve();
  }).then(function() {
    if(!that.isExpiringEvents()) {
      return that.advanceTime(0);
	}
  });
};

function createThoth() {
  return new Thoth();
}

module.exports = createThoth();