var UIDManager = require("./UIDManager");

function TimerRepository(config, uidGenerator) {
  this.config = config;
  this.uidManager = new UIDManager(uidGenerator);
  this.timers = [];  
}

TimerRepository.prototype.insertTimer = function(timer) {

  if(!timer.uid) {
    timer.uid = this.uidManager.getUid();
  }
  timer.sequenceNumber = this.uidManager.nextSequenceNumber();
  
  var i;
  for(i = 0; i < this.timers.length; ++i) {
    // JS timers have no more than 1ms resolution
    if(this.timers[i].dueTime.isLongerThan(timer.dueTime)) {
	  break;
	}
  }
  
  this.timers.splice(i, 0, timer);
  return timer.uid;
};

TimerRepository.prototype.clearTimer = function(uid) {

  var uidValidation = this.uidManager.isAcceptableUid(uid);
  if(!uidValidation.passed) {
	if(this.config.throwOnInvalidClearTimer) {
	  throw new Error("Invalid UID during clearing timer. Reason: " + uidValidation.failureReason);
	}
	
	return;
  }

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
  this.uidManager.clear();
};

TimerRepository.prototype.nextTimer = function() {
  return this.timers[0];
};

TimerRepository.prototype.lastTimer = function() {
  return this.timers[this.timers.length - 1];
};

module.exports = TimerRepository;