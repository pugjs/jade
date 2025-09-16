'use strict';

var fs = require('fs');
var path = require('path');
var pug = require('../');

describe('include debug_sources are strings (no Buffer passed to pug_rethrow)', function() {
  it('does not throw "str.split is not a function" when error originates in included file', function() {
    var dir = path.join(__dirname, 'rethrow-buffers');
    var file = path.join(dir, 'index.pug');
    var src = fs.readFileSync(file, 'utf8');

    var fn = pug.compile(src, {
      filename: file.replace(/\\/g, '/'),
      basedir: dir.replace(/\\/g, '/'),
      compileDebug: true,
      pretty: true,
    });

    var threw = false;
    try {
      fn({});
    } catch (err) {
      threw = true;
      // Regression check: the historic bug caused a TypeError here because
      // includeSources held Buffers and pug_rethrow called split on them.
      if (/split is not a function/.test(String(err && err.message))) {
        throw new Error('Regression: pug_rethrow attempted to split a non-string');
      }
      // Sanity: message should reference the included file path
      if (String(err && err.message).indexOf('include.pug') === -1) {
        throw new Error('Expected error message to reference included file');
      }
    }
    if (!threw) throw new Error('Expected render to throw');
  });
});


