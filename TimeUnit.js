"use strict";
var assert = require("assert");
var TypeChecks = require("./detail/utils/TypeChecks");

function TimeUnit(value) {
  assert(TypeChecks.isNumber(value) && "argument for creating TimeUnit must be a number. Given: " + typeof value);
  this.value = value;
}

TimeUnit.prototype.toStandardTime = function (timer) {
  return this.value / timer.coefficient;
};

TimeUnit.prototype.add = function(time) {
  return this.setTo(this.extended(time));
};

TimeUnit.prototype.extended = function(time) {
  assert(time instanceof TimeUnit);
  var value = this.value + time.value;
 
  return new TimeUnit(value);
};

TimeUnit.prototype.shortened = function(time) {
  return this.extended(new TimeUnit(-time.value));
};

TimeUnit.prototype.subtract = function(time) {
  return this.setTo(this.shortened(time));
};

TimeUnit.prototype.setTo = function(time) {
  assert(time instanceof TimeUnit);
  
  this.value = time.value;
  return this;
};

TimeUnit.prototype.copy = function() {
  return new TimeUnit(this.value);
};

var EPSILON_EQUALITY_COEFFICIENT = 1e-6;
TimeUnit.prototype.isLongerThan = function(time) {
  assert(time instanceof TimeUnit);
  
  return (this.value - time.value) > EPSILON_EQUALITY_COEFFICIENT;
};

TimeUnit.prototype.isShorterThan = function(time) {
  assert(time instanceof TimeUnit);
  
  return (this.value - time.value) < -EPSILON_EQUALITY_COEFFICIENT;
};

TimeUnit.prototype.isEqualTo = function(time) {
  assert(time instanceof TimeUnit);
  
  return Math.abs(this.value - time.value) < EPSILON_EQUALITY_COEFFICIENT;
};

TimeUnit.prototype.toNanoseconds = function() {return this.toStandardTime(standardTimers.nanoseconds);};
TimeUnit.prototype.toMicroseconds = function() {return this.toStandardTime(standardTimers.microseconds);};
TimeUnit.prototype.toMilliseconds = function() {return this.toStandardTime(standardTimers.milliseconds);};
TimeUnit.prototype.toSeconds = function() {return this.toStandardTime(standardTimers.seconds);};
TimeUnit.prototype.toMinutes = function() {return this.toStandardTime(standardTimers.minutes);};
TimeUnit.prototype.toHours = function() {return this.toStandardTime(standardTimers.hours);};
TimeUnit.prototype.toDays = function() {return this.toStandardTime(standardTimers.days);};
TimeUnit.prototype.toWeeks = function() {return this.toStandardTime(standardTimers.weeks);};

function standardTime(coefficient) {
  var StandardTimer = function(value) {
    return new TimeUnit(value * coefficient);
  };
  
  StandardTimer.coefficient = coefficient;
  return StandardTimer;
}

var standardTimers = function(value) {
  if(value instanceof TimeUnit) {
    return value.copy();
  }
   
  return standardTimers.milliseconds(value);
};

standardTimers.nanoseconds = standardTime(1);
standardTimers.microseconds = standardTime(1e3 * standardTimers.nanoseconds.coefficient);
standardTimers.milliseconds = standardTime(1e3 * standardTimers.microseconds.coefficient);
standardTimers.seconds = standardTime(1e3 * standardTimers.milliseconds.coefficient);
standardTimers.minutes = standardTime(60 * standardTimers.seconds.coefficient);
standardTimers.hours = standardTime(60 * standardTimers.minutes.coefficient);
standardTimers.days = standardTime(24 * standardTimers.hours.coefficient);
standardTimers.weeks = standardTime(7 * standardTimers.days.coefficient);
standardTimers.isInstance = function(x) { return x instanceof TimeUnit; };


module.exports = standardTimers;