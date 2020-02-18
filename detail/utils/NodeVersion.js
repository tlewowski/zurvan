'use strict';

var nodeVersionRegex = /v([0-9]+)\.([0-9]+)\.([0-9]+)/;

var versionMatch = [];
if (global.process) {
  versionMatch = nodeVersionRegex.exec(global.process.version);
}

var version = {
  major: versionMatch[1] && parseInt(versionMatch[1]),
  minor: versionMatch[2] && parseInt(versionMatch[2]),
  patch: versionMatch[3] && parseInt(versionMatch[3])
};

var features = {};
features.hasPromise = version.major > 0 || version.minor > 10;
features.hasMicroqueuedNextTick = features.hasPromise && version.major < 12;

version.features = features;

module.exports = version;
