var UIDGenerator = require("./UIDGenerator");

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
    if(this.timers[i].dueTime > timer.dueTime) {
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

module.exports = TimerRepository;