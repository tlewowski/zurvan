"use strict";
var FieldOverrider = require("./FieldOverrider");
var UIDManager = require("./UIDManager");
var SequenceGenerator = require("./SequenceGenerator");
var TypeChecks = require("./TypeChecks");
var assert = require("assert");

function ImmediateInterceptor() {
  this.awaitingImmediates = {size: 0};
  this.uidManager = new UIDManager(new SequenceGenerator());
}

ImmediateInterceptor.prototype.intercept = function(config) {
  this.config = config;
  
  this.setImmediates = new FieldOverrider(global, "setImmediate", this.addImmediate.bind(this));
  this.clearImmediates = new FieldOverrider(global, "clearImmediate", this.removeImmediate.bind(this));
  this.enqueue = this.setImmediates.oldValue;
  this.dequeue = this.clearImmediates.oldValue;

  if(TypeChecks.isFunction(this.config.bluebird)) {
    this.previousBluebirdScheduler = this.config.bluebird.setScheduler(this.endOfQueueScheduler());
  }
  else if(this.config.bluebird !== undefined) {
    throw new Error("if given, bluebird configuration parameter to zurvan must be a function representing bluebird library");
  }
};

ImmediateInterceptor.prototype.release = function() {
  var that = this;
  Object.keys(this.awaitingImmediates).forEach(function(uid) {
    that.dequeue(that.awaitingImmediates[uid]);
  });
  this.awaitingImmediates = {size: 0};

  this.setImmediates.restore();
  this.clearImmediates.restore();
  
  if(this.previousBluebirdScheduler) {
    this.config.bluebird.setScheduler(this.previousBluebirdScheduler);
	this.previousBluebirdScheduler = undefined;
  }
  
  this.enqueue = undefined;
  this.dequeue = undefined;
};

ImmediateInterceptor.prototype.addImmediate = function(callback) {
  var uid = this.uidManager.getUid();
  
  var that = this;
  var args = [].splice.call(arguments, 1);
  this.awaitingImmediates[uid.uid] = this.enqueue(function() {
    that.remove(uid);	
    callback.apply(undefined, args);
  });
  ++this.awaitingImmediates.size;
  
  return uid;
};

ImmediateInterceptor.prototype.remove = function(uid) {
  var toDequeue;
  if(this.awaitingImmediates[uid.uid] !== undefined) {
    toDequeue = this.awaitingImmediates[uid.uid];
	delete this.awaitingImmediates[uid.uid];
    --this.awaitingImmediates.size;
  }
  assert(this.awaitingImmediates.size >= 0);

  return toDequeue;
};

ImmediateInterceptor.prototype.removeImmediate = function(uid) {
  return this.dequeue(this.remove(uid));
};

ImmediateInterceptor.prototype.areAwaiting = function() {
  return this.awaitingImmediates.size > 0;
};

ImmediateInterceptor.prototype.endOfQueueScheduler = function() {
  return setImmediate;
}

module.exports = ImmediateInterceptor;