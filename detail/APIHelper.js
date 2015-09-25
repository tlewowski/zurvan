function exportFunction(exportedObject, functionName) {
  return function() {
    return exportedObject[functionName].apply(exportedObject, [].splice.call(arguments, 0));
  };
}

function createAPI(exportedObject, functionNames) {
  return functionNames.reduce(function(api, name) {
    api[name] = exportFunction(exportedObject, name);
	return api;
  }, {});
}

module.exports.createAPI = createAPI;