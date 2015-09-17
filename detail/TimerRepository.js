function TimerRepository() {
  this.uid = 1;
  this.timers = [];  
}

TimerRepository.prototype.insertTimer = function(timer) {

  timer.uid = this.uid++;
  var i;
  for(i = 0; i < this.timers.length; ++i) {
    if(this.timers[i].dueTime > timer.dueTime) {
	  break;
	}
  }
  
  this.timers.splice(i, 0, timer);
};

TimerRepository.prototype.removeTimer = function(timer) {
  var i;
  for(i = 0; i < this.timers.length; ++i) {
    if(this.timers[i].uid === timer.uid) {
	  break;
	}
  }
  
  this.timers.splice(i, 1);
}

TimerRepository.prototype.nextTimer = function() {
  return this.timers[0];
};

module.exports = TimerRepository;