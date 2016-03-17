var TypeChecks = require("./utils/TypeChecks");

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

function contextualFunctionDependency(functionName) {
  return {
    status: function(context) {
      if(context === undefined) {
        return 'does not exist (not even its object context)';
      }
      
	    var obj = {};
	    obj[functionName] = dependencyExistsAsFunction(context[functionName]);
	    return obj;	  
	  }
  };
}

var deps = {
  atIntercept: {
    Promise: {
      status: function(context) {
	      var dependencyStatuses = contextualFunctionDependency("promiseScheduler").status(context);
        if(dependencyStatuses.promiseScheduler === dependencyOK) {
          var promiseScheduler = context.promiseScheduler;
	        dependencyStatuses["promiseScheduler.resolve"] = dependencyExistsAsFunction(promiseScheduler.resolve);
  	      dependencyStatuses["promiseScheduler.reject"] = dependencyExistsAsFunction(promiseScheduler.reject);
	        dependencyStatuses["promiseScheduler.prototype.then"] = dependencyExistsAsFunction(promiseScheduler.prototype.then);
  	      dependencyStatuses["promiseScheduler.prototype.catch"] = dependencyExistsAsFunction(promiseScheduler.prototype.catch);
	      }
	      return dependencyStatuses;
      }
    }
  },
  atStartup: {
    setImmediate: contextualFunctionDependency("setImmediate"),
    clearImmediate: contextualFunctionDependency("clearImmediate")    
  }
};

function missingDependencies(deps, context) {
  return Object.keys(deps).map(function(key) {
    return {name: key, statuses: deps[key].status(context)};
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

module.exports = {
  missingAtStartup: function() {
    return missingDependencies(deps.atStartup, global);
  },
  
  missingAtIntercept: function(config) {
    return missingDependencies(deps.atIntercept, config);
  }
};