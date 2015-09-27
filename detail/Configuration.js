function mergeConfigurations(localConfiguration, globalConfiguration) {
  var finalConfiguration = {};
  
  Object.keys(globalConfiguration).forEach(function(key) {
    finalConfiguration[key] = globalConfiguration[key];
  });
  
  if(localConfiguration !== undefined) {
    Object.keys(localConfiguration).forEach(function(key) {
      finalConfiguration[key] = localConfiguration[key];
    });
  }
  return finalConfiguration;
}

module.exports.merge = mergeConfigurations;