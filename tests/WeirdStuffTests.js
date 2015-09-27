var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan").withDefaultConfiguration({systemTime: "2015-09-01T00:00:00.000Z"});

var assert = require("assert");

describe('zurvan', function() {
  it('shall reject intercepting timers if they are already intercepted', function(done) {
    var zurvan2 = zurvan.withDefaultConfiguration({});
	
	zurvan.interceptTimers().then(function() {
	  return zurvan2.interceptTimers();
	}).then(function() {
	  done(new Error("Zurvan should not be able to intercept timers that are already intercepted"));
	}, function() {
	  return zurvan.releaseTimers().then(done, done);
	});
  });
});