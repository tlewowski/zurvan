var Timer = require("./Timer");

function IntervalTimer(callback, timerRepository, currentTime, callDelay) {
  Timer.bind(this)(callback, timerRepository, currentTime, callDelay);
}

IntervalTimer.prototype = Object.create(Timer.prototype);
IntervalTimer.prototype.precall = function reschedule() {
  this.dueTime = this._currentTime.extended(this._callDelay);
  this._timerRepository.insertTimer(this);
};

module.exports = IntervalTimer;