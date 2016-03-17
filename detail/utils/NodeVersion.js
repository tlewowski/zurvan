"use strict";

var nodeVersionRegex = /v([0-9]+)\.([0-9]+)\.([0-9]+)/;
var versionMatch = process ? nodeVersionRegex.exec(process.version) : [];

var version = {
  major: parseInt(versionMatch[1]),
  minor: parseInt(versionMatch[2]),
  patch: parseInt(versionMatch[3])  
};

var features = {};
features.hasPromise = version.major > 0 || version.minor > 10;
features.hasMicroqueuedNextTick = features.hasPromise;

version.features = features;

module.exports = version;