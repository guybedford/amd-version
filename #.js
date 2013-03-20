/*
 * RequireJS Version Plugin
 * Guy Bedford 2013
 * MIT
 */
/*
 * Supports any semver ranges for module loading
 * loading multiple versions of a module only when absolutely necessary
 * 
 * Usage:
 *  require '#!jquery ~1.8'
 *  require '#!cs!csmodule >=2.0 <5'
 *
 * Setup:
 *  jquery.versions.js (provides version list):
 *  define(function() { 
 *    return ['1.8.0', '1.8.1'];
 *  });
 *
 *  Implementations then provided with convention:
 *  jquery-1.8.0.js
 *  jquery-1.8.1.js
 * 
 *  Must be a semver format x.x.x.
 * 
 */
define(['./semver', 'require'], function(semver, req) {
  return {
    loadedVersions: {},
    getVersionNum: function(name, build, callback) {
      var hashIndex = name.indexOf(' ');      
      var moduleName = name.substr(0, hashIndex);
      var versionRange = name.substr(hashIndex + 1);

      var loadedVersions = this.loadedVersions;

      if (!semver.validRange(versionRange))
        throw moduleName + ' ' + versionRange + ' has an invalid version range.';

      var moduleShortname = moduleName.split('/').shift();

      var checkVersions = function(supportedVersions) {
        // first check if we have any loaded versions for this module
        if (loadedVersions[moduleName])
          for (var v in loadedVersions[moduleName])
            if (semver.satisfies(v, versionRange))
              return callback(moduleName, v);

        // no supported loaded version - need to load a version
        callback(moduleName, semver.maxSatisfying(supportedVersions, versionRange));
      }

      if (build) {
        var fs = require.nodeRequire('fs');
        checkVersions(eval(''
          + '(function(){ \n'
          + '  var defined; \n'
          + '  var define = function(factory){ \n'
          + '    defined = factory(); \n'
          + '  } \n'
          + fs.readFileSync(req.toUrl(moduleShortName) + '.js') + '\n'
          + '  return defined; \n'
          + '})()'
        ));
      }
      else {
        // load the version ranges for the given moduleName
        req([moduleShortName + '.versions'], checkVersions, function(err) {
          throw 'You need to provide a "' + moduleShortName + '.versions.js" module providing the version array.';
        });
      }
    },
    load: function(name, req, load, config) {
      var loadedVersions = this.loadedVersions;
      this.getVersionNum(name, config.isBuild, function(moduleName, version) {
        // load from the expected filename convention
        req([moduleName + '-' + version], function(m) {
          loadedVersions[moduleName] = loadedVersions[moduleName] || {};
          loadedVersions[moduleName][version] = true;
          load(m);
        });
      });
    },
    write: function(pluginName, name, write) {
      this.getVersionNum(name, true, function(moduleName, version) {
        write.asModule(pluginName + '!' + name, "define(['" + moduleName + '-' + version + "'], function(m){ return m; });")
      });
    }
  };
});
