var assert = require("assert");

function StandardTime(coefficient) {
  var StandardTimer = function(value) {
    return new TimeUnit(coefficient, value);
  };
  
  StandardTimer.coefficient = coefficient;
  return StandardTimer;
}

var standardTimers = {};
standardTimers.nanoseconds = StandardTime(1e-9);
standardTimers.microseconds = StandardTime(1e-6);
standardTimers.milliseconds = StandardTime(1e-3);
standardTimers.seconds = StandardTime(1);
standardTimers.minutes = StandardTime(60);
standardTimers.hours = StandardTime(60 * standardTimers.minutes.coefficient);
standardTimers.days = StandardTime(24 * standardTimers.hours.coefficient);
standardTimers.weeks = StandardTime(7 * standardTimers.days.coefficient);

function TimeUnit(coefficient, value) {
  this.value = value;
  this.coefficient = coefficient;
}

TimeUnit.prototype.toStandardTime = function (timer) {
  return this.value * this.coefficient / timer.coefficient;
};

TimeUnit.prototype.add = function(time) {
  assert(time instanceof TimeUnit);
  this.setTo(this.after(time));
  
  return this;  
};

TimeUnit.prototype.after = function(time) {
  assert(time instanceof TimeUnit);
  var value = this.value;
  var coefficient = this.coefficient;
  
  if(coefficient > time.coefficient) {
    value = value * coefficient / time.coefficient + time.value;
	coefficient = time.coefficient;
  }
  else {
    value = time.value * time.coefficient / coefficient + value;
  }
  
  return new TimeUnit(value, coefficient);
}

TimeUnit.prototype.setTo = function(time) {
  assert(time instanceof TimeUnit);
  
  this.value = time.value;
  this.coefficient = time.coefficient;
};

TimeUnit.prototype.toNanoseconds = function() {return this.toStandardTime(standardTimers.nanoseconds);};
TimeUnit.prototype.toMicroseconds = function() {return this.toStandardTime(standardTimers.microseconds);};
TimeUnit.prototype.toMilliseconds = function() {return this.toStandardTime(standardTimers.milliseconds);};
TimeUnit.prototype.toSeconds = function() {return this.toStandardTime(standardTimers.seconds);};
TimeUnit.prototype.toMinutes = function() {return this.toStandardTime(standardTimers.minutes);};
TimeUnit.prototype.toHours = function() {return this.toStandardTime(standardTimers.hours);};
TimeUnit.prototype.toDays = function() {return this.toStandardTime(standardTimers.days);};
TimeUnit.prototype.toWeeks = function() {return this.toStandardTime(standardTimers.weeks);};

module.exports = standardTimers;