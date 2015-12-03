"use strict";
var FieldOverrider = require("./FieldOverrider");
var TypeChecks = require("./TypeChecks");

var forwardedCalls = ["valueOf", "toUTCString", "toTimeString", "toString", "toSource",
  "toLocaleTimeString", "toLocaleFormat", "toLocaleDateString", "toGMTString", "toJSON",
  "toISOString", "toDateString", "setYear", "setUTCSeconds", "setUTCMonth",
  "setUTCMinutes", "setUTCMilliseconds", "setUTCHours", "setUTCFullYear",
  "setUTCDate", "setTime", "setSeconds", "setMonth", "setMinutes", "setMilliseconds",
  "setHours", "setFullYear", "setDate", "getYear", "getUTCSeconds", "getUTCMonth",
  "getUTCMinutes", "getUTCMilliseconds", "getUTCHours", "getUTCFullYear", "getUTCDay",
  "getUTCDate", "getTimezoneOffset", "getTime", "getSeconds", "getMonth", 
  "getMinutes", "getMilliseconds", "getHours", "getFullYear", "getDay", "getDate"];
  
  
function fakeDate(timeServer) {
  var OriginalDate = global.Date;  

  function makeOriginalDateFromArgs(yearOrTimeAsStringOrTimestamp, month, day, hour, minute, second, millisecond) {
    if(TypeChecks.isString(yearOrTimeAsStringOrTimestamp)) {
	  return new OriginalDate(yearOrTimeAsStringOrTimestamp);
	}
	
	if(month === undefined) { // means: first argument is a timestamp
	  return new OriginalDate(yearOrTimeAsStringOrTimestamp);	  
	}
	
    return new OriginalDate(yearOrTimeAsStringOrTimestamp, month, day, hour, minute, second, millisecond);
  }
  
  // needs to have 7 arguments to be compliant to length of Date constructor
  function FakeDate(a,b,c,d,e,f,g) {
    var argsArray = [].splice.call(arguments, 0);
    var date = (argsArray.length === 0) ? new OriginalDate(Date.now()) : makeOriginalDateFromArgs.apply(undefined, argsArray);
	
	if(!(this instanceof FakeDate)) {
	  return date.toString();
	}
	
    this._date = date;
  }

  forwardedCalls.forEach(function(property) {
    if(TypeChecks.isFunction(OriginalDate.prototype[property])) {
	  FakeDate.prototype[property] = function() {
	    var args = [].splice.call(arguments, 0);
		if(this instanceof OriginalDate) {
		  return this[property].apply(this, args);
        }
		
		return this._date[property].apply(this._date, args);
	  };
	}
  });
  
  FakeDate.UTC = Date.UTC;
  FakeDate.parse = Date.parse;
  FakeDate.now = function()  {
    return Math.floor(timeServer.systemTimeOffset.extended(timeServer.currentTime).toMilliseconds());
  };
  
  return FakeDate;
}

function DateInterceptor(timeServer) {
  this._fakeDateCreator = fakeDate(timeServer);
}

DateInterceptor.prototype.intercept = function() {
  this.dateOverrider = new FieldOverrider(global, "Date", this._fakeDateCreator);
};

DateInterceptor.prototype.release = function() {
  var now = new Date();
  this.dateOverrider.restore();
  return now;
};

module.exports = DateInterceptor;