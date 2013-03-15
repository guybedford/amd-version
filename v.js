define(['./semver', 'require'], function(semver, req) {
  return {
    loadedVersions: {},
    getVersionNum: function(name, build, callback) {
      var hashIndex = name.lastIndexOf('#');      
      var moduleName = name.substr(0, hashIndex);
      var versionRange = name.substr(hashIndex + 1);

      var loadedVersions = this.loadedVersions;

      if (!semver.validRange(versionRange))
        throw moduleName + '#' + versionRange + ' has an invalid version range.';

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
          + fs.readFileSync(req.toUrl(moduleName) + '.js') + '\n'
          + '  return defined; \n'
          + '})()'
        ));
      }
      else {
        // load the version ranges for the given moduleName
        req([moduleName], checkVersions, function(err) {
          throw 'You need to provide a "' + moduleName + '" module providing the version array.';
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