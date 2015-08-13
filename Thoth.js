var FieldOverrider = require("./FieldOverrider");

function Timer(callback, dueTime) {
  this.callback = callback;
  this.dueTime = dueTime;
}


function Thoth() {
  this.timers = [];
  this.currentTime = {milliseconds: 0, nanoseconds: 0};
}

Thoth.prototype.startTime = function() {
};

Thoth.prototype.stopTime = function() {
  this.timeoutOverrider = new FieldOverrider(global, "setTimeout", this.addTimer.bind(this));
};

Thoth.prototype.addTimer = function(callback, time) {
  var timer = new Timer(callback, time + this.currentTime.milliseconds);
  
  var i;
  for(i = 0; i < this.timers.length; ++i) {
    if(this.timers[i].dueTime > timer.dueTime) {
	  break;
	}
  }
  
  this.timers.splice(i, 0, timer);
  
}

Thoth.prototype.advanceTime = function(time) {
  this.timers.forEach(function(time){time.callback();});
};

function createThoth() {
  return new Thoth();
}

module.exports = createThoth();