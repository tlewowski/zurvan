var TypeChecks = require("./TypeChecks");

var dependencyOK = 'OK';
var lineBreak = '\n';
var reasonSeparator = ';';

function dependencyExistsAsFunction(f) {
  if(f === undefined) {
    return 'does not exist';
  }
  if(!TypeChecks.isFunction(f)) {
    return 'is not a function';
  }
  return dependencyOK;
}

function globalFunctionDependency(functionName) {
  return {
    status: function() {
	  var obj = {};
	  obj["global." + functionName] = dependencyExistsAsFunction(global[functionName]);
	  return obj;	  
	}
  };
}

var deps = {
  Promise: {
    status: function() {
	
	  var dependencyStatuses = globalFunctionDependency("Promise").status();
      if(dependencyStatuses["global.Promise"] === dependencyOK) {
	    dependencyStatuses["global.Promise.resolve"] = dependencyExistsAsFunction(global.Promise.resolve);
	    dependencyStatuses["global.Promise.reject"] = dependencyExistsAsFunction(global.Promise.reject);
	    dependencyStatuses["global.Promise.prototype.then"] = dependencyExistsAsFunction(global.Promise.prototype.then);
	    dependencyStatuses["global.Promise.prototype.catch"] = dependencyExistsAsFunction(global.Promise.prototype.catch);
	  }
	  
	  return dependencyStatuses;
    }
  },
  setImmediate: globalFunctionDependency("setImmediate"),
  clearImmediate: globalFunctionDependency("clearImmediate")
};

module.exports = {
  missing: function() {
    return Object.keys(deps).map(function(key) {
	  return {name: key, statuses: deps[key].status()};
	}).map(function(dependency) {
	  return {
	    name: dependency.name, 
		statuses: Object.keys(dependency.statuses).filter(function(statusName) {
	      return dependency.statuses[statusName] !== dependencyOK;
		}).map(function(statusName) {
		  return statusName + " " + dependency.statuses[statusName];
		})
	  };
	}).filter(function(dependency) {
	  return dependency.statuses.length > 0;
	}).map(function(dependency) {
	  return "Missing dependency: " + dependency.name + ". Reason(s): " + dependency.statuses.join(reasonSeparator);
	}).join(lineBreak);
  }
};