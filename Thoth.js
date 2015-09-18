var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var TimerInterceptor = require("./detail/TimerInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var assert = require("assert");

function Thoth() {
  this.currentTime = {milliseconds: 0, nanoseconds: 0};
}

Thoth.prototype.startTime = function() {
  assert(!this.isForwarding(), "Cannot start time while it is being forwarded!");
  
  this.currentTime = {milliseconds: 0, nanoseconds: 0};  

  this.immediateInterceptor.restore();	
  this.processTimerInterceptor.restore();
  this.timerInterceptor.restore();
};

Thoth.prototype.stopTime = function() {
  this.timerInterceptor = new TimerInterceptor(this);
  this.processTimerInterceptor = new ProcessTimerInterceptor(this);
  this.immediateInterceptor = new ImmediateInterceptor();

  this.currentTime = {milliseconds: 0, nanoseconds: 0};
};

Thoth.prototype.startForwarding = function() {
  this.forwardingOngoing = true;
};

Thoth.prototype.stopForwarding = function() {
  this.forwardingOngoing = false;
};

Thoth.prototype.isForwarding = function() {
  return this.forwardingOngoing;
};

Thoth.prototype.advanceTime = function(timeToForward) {
  if(timeToForward < 0) {
    throw new Error("Even Thoth cannot move back in time!");
  }

  if(this.isForwarding()) {
    throw new Error("Cannot forward time from two places simultaneously");
  }

  this.immediateInterceptor.enqueue(function() {
    advanceTimeHelper(timeToForward);
  });
  
  var that = this;
  function advanceTimeHelper(time) {
    if(that.immediateInterceptor.areAwaiting()) {
      that.immediateInterceptor.enqueue(function() {
        advanceTimeHelper(time);
      });
      return;
    }

    var targetTime = that.currentTime.milliseconds + time;
    that.startForwarding();
	
	var closestTimer = that.timerInterceptor.next();
    if(closestTimer && closestTimer.dueTime <= targetTime) {
      that.currentTime.milliseconds = closestTimer.dueTime;
      var nextTimeStep = targetTime - closestTimer.dueTime;
      if(nextTimeStep === 0) {
	    that.stopForwarding();
	  }
	  
      that.immediateInterceptor.enqueue(function() {
	    closestTimer.expire();
        advanceTimeHelper(nextTimeStep);
  	  });
    }
	else {
      that.currentTime.milliseconds = targetTime;
      that.stopForwarding();
  	  return;	  
    }
  }
};

function createThoth() {
  return new Thoth();
}

module.exports = createThoth();