var deps = ["Promise", "setImmediate", "clearImmediate"];

module.exports = {
  missing: function() {
    return deps.filter(function(dep) {
	  return global[dep] === undefined;
	}).map(function(dep) {
	  return "Missing dependency: " + dep;
	}).join("\n");
  }
};