"use strict";
var TimeUnit = require("../../TimeUnit");

function Timer(callback, timerRepository, currentTime, callDelay) {
  this._currentTime = currentTime;
  this._timerRepository = timerRepository;
  
  this.callback = callback;
  this.callDelay = TimeUnit.milliseconds(callDelay);
  this.dueTime = currentTime.extended(this.callDelay);
}

Timer.prototype.expire = function() {
  this.precall();
  this.callback.call();
};

Timer.prototype.clear = function() {
  if(!this.uid) {
	throw new Error("Cannot clear timeout that does not have an UID assigned! It's an SW bug, please report it");
  }

  this._timerRepository.clearTimer(this.uid);
};

module.exports = Timer;