"use strict";
var TimeUnit = require("../../TimeUnit");

function Timer(callback, timerRepository, currentTime, callDelay) {
  this._callback = callback;
  this._callDelay = TimeUnit.milliseconds(callDelay);
  this._currentTime = currentTime;
  this._timerRepository = timerRepository;
  
  this.dueTime = currentTime.extended(this._callDelay);
}

Timer.prototype.expire = function() {
  this.precall();
  this._callback.call();
};

Timer.prototype.clear = function() {
  if(!this.uid) {
	throw new Error("Cannot clear timeout that does not have an UID assigned! It's an SW bug, please report it");
  }

  this._timerRepository.clearTimer(this.uid);
}

module.exports = Timer;