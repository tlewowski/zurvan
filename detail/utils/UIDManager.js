"use strict";
var TypeChecks = require("./TypeChecks");
var SequenceGenerator = require("./SequenceGenerator");

function UIDManager() {
  this._sequenceGenerator = new SequenceGenerator();  
  this._issuedUids = {};
}

function serialize(value) {
  var serialized;
  try {
	serialized = JSON.stringify(value);
    if(!serialized) {
  	  serialized = value.toString();
    }
  }
  catch(err) {
	serialized = "not easily serializable: <<" + value + ">>";
  }
	  
  return serialized;
}    

function failure(reason) {
  return {
    passed: false,
    failureReason: reason
  };
}

function success() {
  return {
    passed: true
  };
}

UIDManager.prototype.setUp = function(throwOnValidationFailure, uidUser) {
  this._throwOnValidationFailure = throwOnValidationFailure;
  this._uidUser = uidUser;
};

UIDManager.prototype.isAcceptableUidImpl = function(uid) {
  if (!TypeChecks.isObject(uid)) {
    return failure(serialize(uid) + " is not an object");
  }
  
  if(this._issuedUids[uid.uid] !== uid) {
    return failure(serialize(uid) + " was not issued");
  }
  
  return success();
};

UIDManager.prototype.isAcceptableUid = function(uid) {
  var uidValidation = this.isAcceptableUidImpl(uid);
  if(!uidValidation.passed) {
	if(this._throwOnValidationFailure) {
	  throw new Error("Invalid UID during clearing " + this._uidUser + ". Reason: " + uidValidation.failureReason);
	}
	
	return false;
  }
  return true;
};

UIDManager.prototype.getUid = function() {
  var sequenceNumber = this._sequenceGenerator.generate();

  var uid = {uid: sequenceNumber};
  uid.ref = uid;
  
  this._issuedUids[uid.uid] = uid;
	
  return uid;
};


UIDManager.prototype.clear = function() {
  this._issuedUids = {};
};

module.exports = UIDManager;