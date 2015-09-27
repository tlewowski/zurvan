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
  
  function FakeDate() {
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
	    return this._date[property].apply(this._date, [].splice.call(arguments, 0));
	  };
	}
  });
  
  FakeDate.length = 7; // JS spec says so - max number of constructor arguments
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
}

DateInterceptor.prototype.release = function() {
  this.dateOverrider.restore();
};

module.exports = DateInterceptor;