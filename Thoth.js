var FieldOverrider = require("./detail/FieldOverrider");
var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var TimerInterceptor = require("./detail/TimerInterceptor");

function Thoth() {
  this.timers = [];
  this.currentTime = {milliseconds: 0, nanoseconds: 0};
}

Thoth.prototype.startTime = function() {
  this.timerInterceptor.restore();
  this.immediateInterceptor.restore();
	
  this.stopForwarding();  
  this.timers = [];
  this.currentTime = {milliseconds: 0, nanoseconds: 0};  
};

Thoth.prototype.stopTime = function() {
  this.timers = [];
  this.timerInterceptor = new TimerInterceptor(this);
  this.immediateInterceptor = new ImmediateInterceptor();
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

Thoth.prototype.insertTimer = function(timer) {
  var i;
  for(i = 0; i < this.timers.length; ++i) {
    if(this.timers[i].dueTime > timer.dueTime) {
	  break;
	}
  }
  
  this.timers.splice(i, 0, timer);  
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
    if(that.timers.length > 0 && that.timers[0].dueTime <= targetTime) {
      var closestTimer = that.timers.splice(0, 1)[0];

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