var FieldOverrider = require("./FieldOverrider");
var TypeUtils = require("./TypeUtils");

var forwardedCalls = ["valueOf", "toUTCString", "toTimeString", "toString", "toSource",
  "toLocaleTimeString", "toLocaleFormat", "toLocaleDateString", "toGMTString", "toJSON",
  "toISOString", "toDateString", "setYear", "setUTCSeconds", "setUTCMonth",
  "setUTCMinutes", "setUTCMilliseconds", "setUTCHours", "setUTCFullYear",
  "setUTCDate", "setTime", "setSeconds", "setMonth", "setMinutes", "setMilliseconds",
  "setHours", "setFullYear", "setDate", "getYear", "getUTCSeconds", "getUTCMonth",
  "getUTCMinutes", "getUTCMilliseconds", "getUTCHours", "getUTCFullYear", "getUTCDay",
  "getUTCDate", "getTimezoneOffset", "getTime", "getSeconds", "getMonth", 
  "getMinutes", "getMilliseconds", "getHours", "getFullYear", "getDay", "getDate"];
  
  
function fakeDate(currentTime) {
  var OriginalDate = global.Date;  

  function makeOriginalDateFromArgs(year, month, day, hour, minute, second, millisecond) {
    if(typeof year === 'string' || month === undefined) {
	  return new OriginalDate(year);
	}
    return new OriginalDate(year, month, day, hour, minute, second, millisecond);
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
    if(TypeUtils.isFunction(OriginalDate.prototype[property])) {
	  FakeDate.prototype[property] = function() {
	    return this._date[property].apply(this._date, [].splice.call(arguments, 0));
	  };
	}
  });
  
  FakeDate.length = 7; // JS spec says so - max number of constructor arguments
  FakeDate.UTC = Date.UTC;
  FakeDate.parse = Date.parse;
  FakeDate.now = function()  {
    return Math.floor(currentTime.toMilliseconds());
  };
  
  return FakeDate;
}

DateInterceptor.prototype.restore = function() {
  this.dateOverrider.restore();
};

function DateInterceptor(timeServer) {
  var fakeDateCreator = fakeDate(timeServer.currentTime);
  this.dateOverrider = new FieldOverrider(global, "Date", fakeDateCreator);
}

module.exports = DateInterceptor;