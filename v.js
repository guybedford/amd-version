define(['./semver'], function(semver) {
  return {
    loadedVersions: {},
    getVersionNum: function(name, callback) {
      var hashIndex = name.lastIndexOf('#');      
      var moduleName = name.substr(0, hashIndex);
      var versionRange = name.substr(hashIndex + 1);

      var loadedCache = this.loadedVersions;

      if (!semver.validRange(versionRange))
        throw moduleName + '#' + versionRange + ' has an invalid version range.';

      // load the version ranges for the given moduleName
      req([moduleName], function(supportedVersions) {
        // first check if we have any loaded versions for this module
        if (loadedVersions[moduleName]) {
          for (var v in loadedVersions[moduleName])
            if (semver.satisfies(v, version))
              return callback(v);
        }

        // no supported loaded version - need to load a version
        callback(semver.maxSatisfying(supportedVersions, version));

      }, function(err) {
        throw 'You need to provide a "' + moduleName + '" module providing the version array.';
      });
    },
    load: function(name, req, load, config) {
      var loadedVersions = this.loadedVersions;
      this.getVersionNum(name, function(version) {
        // load from the expected filename convention
        req([moduleName + '-' + version], function(m) {
          loadedVersions[moduleName] = loadedVersions[moduleName] || {};
          loadedVersions[moduleName][loadVersion] = true;
          load(m);
        });
      });
    },
    write: function(pluginName, name, write) {
      this.getVersionNum(name, function(version) {
        write.asModule(pluginName + '!' + moduleName, "define(['" + name + '-' + version + "'], function(m){ return m; });")
      });
    }
  };
});