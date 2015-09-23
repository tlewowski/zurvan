var UIDGenerator = require("./UIDGenerator");
var TimerType = require("./TimerType");

function TimerRepository() {
  this.uidGenerator = new UIDGenerator();
  this.timers = [];  
}

TimerRepository.prototype.insertTimer = function(timer) {

  if(!timer.uid) {
    timer.uid = this.uidGenerator.generate();
  }
  
  var i;
  for(i = 0; i < this.timers.length; ++i) {
    // JS timers have no more than 1ms resolution
    if(Math.round(this.timers[i].dueTime.toMilliseconds()) > Math.round(timer.dueTime.toMilliseconds())) {
	  break;
	}
  }
  
  this.timers.splice(i, 0, timer);
  return timer.uid;
};

TimerRepository.prototype.clearTimer = function(uid) {
  var i;
  for(i = 0; i < this.timers.length; ++i) {
    if (this.timers[i].uid.uid === uid.uid) {
      this.timers.splice(i, 1);
	  break;
	}
  }
};

TimerRepository.prototype.clearAll = function() {
  this.timers = [];
};

TimerRepository.prototype.nextTimer = function() {
  return this.timers[0];
};

TimerRepository.prototype.lastTimeout = function() {

  var i;
  for(i = this.timers.length - 1; i >= 0; --i) {
    if(this.timers[i].type === TimerType.timeout) {
	  return this.timers[i];
	}
  }
};

module.exports = TimerRepository;