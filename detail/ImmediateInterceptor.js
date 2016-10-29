"use strict";
var FieldOverrider = require("./utils/FieldOverrider");
var UIDManager = require("./utils/UIDManager");
var SequenceGenerator = require("./utils/SequenceGenerator");
var TypeChecks = require("./utils/TypeChecks");
var assert = require("assert");

function ImmediateInterceptor() {
  this.awaitingImmediates = {size: 0};
  this.uidManager = new UIDManager();
}

ImmediateInterceptor.prototype.intercept = function(config) {
  this.config = config;
  
  this.setImmediates = new FieldOverrider(global, "setImmediate", this.addImmediate.bind(this));
  this.clearImmediates = new FieldOverrider(global, "clearImmediate", this.removeImmediate.bind(this));
  this.enqueue = this.setImmediates.oldValue;
  this.dequeue = this.clearImmediates.oldValue;
  
  this.uidManager.setUp(this.config.throwOnInvalidClearTimer, "immediate");

  if(TypeChecks.isFunction(this.config.bluebird)) {
    this.previousBluebirdScheduler = this.config.bluebird.setScheduler(this.endOfQueueScheduler());
  }
  else if(this.config.bluebird !== undefined) {
    throw new Error("if given, bluebird configuration parameter to zurvan must be a function representing bluebird library");
  }
};

ImmediateInterceptor.prototype.release = function(forced) {
  var that = this;
  
  var leftImmediates = this.awaitingImmediates;
  this.awaitingImmediates = {size: 0};

  this.setImmediates.restore();
  this.clearImmediates.restore();
  this.uidManager.clear();
  
  if(this.previousBluebirdScheduler) {
    this.config.bluebird.setScheduler(this.previousBluebirdScheduler);
	this.previousBluebirdScheduler = undefined;
  }
  
  this.enqueue = undefined;
  this.dequeue = undefined;
  
  return leftImmediates;
};

ImmediateInterceptor.prototype.startDroppingImmediates = function() {
  this.dropImmediates = true;
}

ImmediateInterceptor.prototype.addImmediate = function(callback) {
  var uid = this.uidManager.getUid();
  if(this.dropImmediates) {
    this.awaitingImmediates[uid.uid] = new Error().stack;
    ++this.awaitingImmediates.size;
    return uid;
  }
  
  
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
  if(!this.uidManager.isAcceptableUid(uid)) {
	return;
  }

  return this.dequeue(this.remove(uid));
};

ImmediateInterceptor.prototype.areAwaiting = function() {
  return this.awaitingImmediates.size > 0;
};

ImmediateInterceptor.prototype.endOfQueueScheduler = function() {
  return setImmediate.bind(global);
};

ImmediateInterceptor.prototype.internalScheduler = function() {
  return this.enqueue;
}

module.exports = ImmediateInterceptor;