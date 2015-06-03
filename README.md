RequireJS Version Plugin
===

[test](@.js)

**No longer maintained or advised... Use version suffixes in your code, semver ranges are generally a bad idea.**

* Supports any semver ranges for module loading (`~1.8`, `=1.8.1`, `>=0.5 < 2.0.5`).
* Loads multiple versions of a module only when absolutely necessary.
* Optimizer support building only the minimum necessary versions for use.

### Usage
```javascript
  define(function(require) {
    var jquery = require('@!jquery#~1.8');
    var csmodule = require('@!cs!csmodule#>=2.0 <5');
  });
```

### Setup

To allow versioning for a module `moduleName`, provide a version listing file at `moduleName.versions.js`, and then
individual implementations of versions at `moduleName-x.x.x.js`.

For example, to provide jQuery versions:

jquery.versions.js:
```javascript
  define(function() { 
    return ['1.8.0', '1.8.1'];
  });
```

We then provide the implementation files:
```javascript
  jquery-1.8.0.js
  jquery-1.8.1.js
```
