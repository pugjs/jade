/**
 * Module dependencies.
 */

var pug = require('../');
var assert = require('assert');
var fs = require('fs');

// Shortcut

function getError(str, options) {
  try {
    pug.render(str, options);
  } catch (ex) {
    return ex;
  }
  throw new Error('Input was supposed to result in an error.');
}
function getFileError(name, options) {
  try {
    pug.renderFile(name, options);
  } catch (ex) {
    return ex;
  }
  throw new Error('Input was supposed to result in an error.');
}

describe('error reporting', function() {
  describe('compile time errors', function() {
    describe('with no filename', function() {
      it('includes detail of where the error was thrown', function() {
        var err = getError('foo(');
        expect(err.message).toMatch(/Pug:1/);
        expect(err.message).toMatch(/foo\(/);
      });
    });
    describe('with a filename', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var err = getError('foo(', {filename: 'test.pug'});
        expect(err.message).toMatch(/test\.pug:1/);
        expect(err.message).toMatch(/foo\(/);
      });
    });
    describe('with a layout without block declaration (syntax)', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var err = getFileError(
          __dirname + '/fixtures/compile.with.layout.syntax.error.pug',
          {}
        );
        expect(err.message).toMatch(/[\\\/]layout.syntax.error.pug:2/);
        expect(err.message).toMatch(/foo\(/);
      });
    });
    describe('with a layout without block declaration (locals)', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var err = getFileError(
          __dirname + '/fixtures/compile.with.layout.locals.error.pug',
          {}
        );
        expect(err.message).toMatch(/[\\\/]layout.locals.error.pug:2/);
        expect(err.message).toMatch(/is not a function/);
      });
    });
    describe('with a include (syntax)', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var err = getFileError(
          __dirname + '/fixtures/compile.with.include.syntax.error.pug',
          {}
        );
        expect(err.message).toMatch(/[\\\/]include.syntax.error.pug:2/);
        expect(err.message).toMatch(/foo\(/);
      });
    });
    describe('with a include (locals)', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var err = getFileError(
          __dirname + '/fixtures/compile.with.include.locals.error.pug',
          {}
        );
        expect(err.message).toMatch(/[\\\/]include.locals.error.pug:2/);
        expect(err.message).toMatch(/foo\(/);
      });

      it('handles compileDebug option properly', function() {
        var err = getFileError(
          __dirname + '/fixtures/compile.with.include.locals.error.pug',
          {
            compileDebug: true,
          }
        );
        expect(err.message).toMatch(/[\\\/]include.locals.error.pug:2/);
        expect(err.message).toMatch(/foo is not a function/);
      });
    });

    describe('with a layout (without block) with an include (syntax)', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var err = getFileError(
          __dirname +
            '/fixtures/compile.with.layout.with.include.syntax.error.pug',
          {}
        );
        expect(err.message).toMatch(/[\\\/]include.syntax.error.pug:2/);
        expect(err.message).toMatch(/foo\(/);
      });
    });
    describe('with a layout (without block) with an include (locals)', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var err = getFileError(
          __dirname +
            '/fixtures/compile.with.layout.with.include.locals.error.pug',
          {}
        );
        expect(err.message).toMatch(/[\\\/]include.locals.error.pug:2/);
        expect(err.message).toMatch(/foo\(/);
      });
    });
    describe('block that is never actually used', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var err = getFileError(
          __dirname + '/fixtures/invalid-block-in-extends.pug',
          {}
        );
        expect(err.message).toMatch(/invalid-block-in-extends.pug:6/);
        expect(err.message).toMatch(/content/);
      });
    });
    describe('Unexpected character', function() {
      it('includes details of where the error was thrown', function() {
        var err = getError('ul?', {});
        expect(err.message).toMatch(/unexpected text \"\?\"/);
      });
    });
    describe('Include filtered', function() {
      it('includes details of where the error was thrown', function() {
        var err = getError('include:verbatim()!', {});
        assert(err.message.indexOf('unexpected text "!"') !== -1);
        var err = getError('include:verbatim ', {});
        assert(err.message.indexOf('missing path for include') !== -1);
      });
    });
    describe('mixin block followed by a lot of blank lines', function() {
      it('reports the correct line number', function() {
        var err = getError('mixin test\n    block\n\ndiv()Test');
        var line = /Pug\:(\d+)/.exec(err.message);
        assert(line, 'Line number must be included in error message');
        assert(
          line[1] === '4',
          'The error should be reported on line 4, not line ' + line[1]
        );
      });
    });
  });
  describe('runtime errors', function() {
    describe('with no filename and `compileDebug` left undefined', function() {
      it('just reports the line number', function() {
        var sentinel = new Error('sentinel');
        var err = getError('-foo()', {
          foo: function() {
            throw sentinel;
          },
        });
        expect(err.message).toMatch(/on line 1/);
      });
    });
    describe('with no filename and `compileDebug` set to `true`', function() {
      it('includes detail of where the error was thrown', function() {
        var sentinel = new Error('sentinel');
        var err = getError('-foo()', {
          foo: function() {
            throw sentinel;
          },
          compileDebug: true,
        });
        expect(err.message).toMatch(/Pug:1/);
        expect(err.message).toMatch(/-foo\(\)/);
      });
    });
    describe('with a filename that does not correspond to a real file and `compileDebug` left undefined', function() {
      it('just reports the line number', function() {
        var sentinel = new Error('sentinel');
        var err = getError('-foo()', {
          foo: function() {
            throw sentinel;
          },
          filename: 'fake.pug',
        });
        expect(err.message).toMatch(/on line 1/);
      });
    });
    describe('with a filename that corresponds to a real file and `compileDebug` left undefined', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var sentinel = new Error('sentinel');
        var path = __dirname + '/fixtures/runtime.error.pug';
        var err = getError(fs.readFileSync(path, 'utf8'), {
          foo: function() {
            throw sentinel;
          },
          filename: path,
        });
        expect(err.message).toMatch(/fixtures[\\\/]runtime\.error\.pug:1/);
        expect(err.message).toMatch(/-foo\(\)/);
      });
    });
    describe('in a mixin', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var err = getFileError(
          __dirname + '/fixtures/runtime.with.mixin.error.pug',
          {}
        );
        expect(err.message).toMatch(/mixin.error.pug:2/);
        expect(err.message).toMatch(/Cannot read (properties of null|property 'length' of null)/);
      });
    });
    describe('in a layout', function() {
      it('includes detail of where the error was thrown including the filename', function() {
        var err = getFileError(
          __dirname + '/fixtures/runtime.layout.error.pug',
          {}
        );
        expect(err.message).toMatch(/layout.with.runtime.error.pug:3/);
        expect(err.message).toMatch(
          /Cannot read (properties of undefined|property 'length' of undefined)/
        );
      });
    });
  });
  describe('deprecated features', function() {
    it('warns about element-with-multiple-attributes', function() {
      var consoleWarn = console.warn;
      var log = '';
      console.warn = function(str) {
        log += str;
      };
      var res = pug.renderFile(
        __dirname + '/fixtures/element-with-multiple-attributes.pug'
      );
      console.warn = consoleWarn;
      expect(log).toMatch(/element-with-multiple-attributes.pug, line 1:/);
      expect(log).toMatch(
        /You should not have pug tags with multiple attributes/
      );
      expect(res).toBe('<div attr="val" foo="bar"></div>');
    });
  });
  describe("if you throw something that isn't an error", function() {
    it('just rethrows without modification', function() {
      var err = getError('- throw "foo"');
      expect(err).toBe('foo');
    });
  });
  describe('import without a filename for a basedir', function() {
    it('throws an error', function() {
      var err = getError('include foo.pug');
      expect(err.message).toMatch(/the "filename" option is required to use/);
      var err = getError('include /foo.pug');
      expect(err.message).toMatch(/the "basedir" option is required to use/);
    });
  });
});
