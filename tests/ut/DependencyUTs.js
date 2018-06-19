'use strict';

var Dependencies = require('../../detail/Dependencies');
var assert = require('assert');

describe('Dependencies missing at intercept time', function() {
  returnsMissingDependency(undefined);
  returnsMissingDependency(null);
  returnsMissingDependency('abc');
  returnsMissingDependency(51);
  returnsMissingDependency(function() {});

  function returnsMissingDependency(value) {
    it('on ' + typeof value + ' throws an error', function(done) {
      var result = Dependencies.missingAtIntercept(value);
      assert(/not even its object context/.test(result));
      done();
    });
  }
});
