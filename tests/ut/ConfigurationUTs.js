"use strict";

var Configuration = require("../../detail/Configuration");
var FieldOverrider = require("../../detail/utils/FieldOverrider");

var assert = require('assert');
var bluebird = require("bluebird");

describe("Configuration missing Promise at request time", function() {  
  it('fetches bluebird as default scheduler', function(done) {
    // workaround to set proper scheduler after using bluebird for testing
    var originalScheduler = bluebird.setScheduler(function(){});
    bluebird.setScheduler(originalScheduler);
    
    var called = false;
    var overriddenPromise = new FieldOverrider(global, "Promise", undefined);
    var overriddenImmediate = new FieldOverrider(global, "setImmediate", function(f) {
      called = true;
      f.apply([].splice.call(arguments, 1));
    });
    
    var config = Configuration.defaultConfiguration();
    assert(config.promiseScheduler === bluebird);
    
    config.promiseScheduler.resolve()
      .then(function() {
        overriddenImmediate.restore();
        overriddenPromise.restore();    
        
        bluebird.setScheduler(originalScheduler);
        assert(called)
      }).then(done, done);
  });
  
});