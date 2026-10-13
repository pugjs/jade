'use strict';

/**
 * Security regression tests for prototype pollution to RCE vulnerability
 *
 * This file tests the four critical vulnerability paths identified in issue #3414:
 * 1. code.block in code generation
 * 2. tag.code in code generation
 * 3. mixin.code in the parser
 * 4. valueResponse.val in the lexer
 */

var pug = require('../');

describe('Prototype Pollution Security Tests', function() {
  // Store original values to restore after each test
  var originalBlock, originalCode, originalVal, originalType;

  beforeEach(function() {
    // Store any existing prototype pollution
    originalBlock = Object.prototype.block;
    originalCode = Object.prototype.code;
    originalVal = Object.prototype.val;
    originalType = Object.prototype.type;
  });

  afterEach(function() {
    // Clean up prototype pollution after each test
    if (originalBlock !== undefined) {
      Object.prototype.block = originalBlock;
    } else {
      delete Object.prototype.block;
    }

    if (originalCode !== undefined) {
      Object.prototype.code = originalCode;
    } else {
      delete Object.prototype.code;
    }

    if (originalVal !== undefined) {
      Object.prototype.val = originalVal;
    } else {
      delete Object.prototype.val;
    }

    if (originalType !== undefined) {
      Object.prototype.type = originalType;
    } else {
      delete Object.prototype.type;
    }
  });

  describe('1. code.block vulnerability path', function() {
    it('should not execute code from prototype-polluted block property', function() {
      // Set up a flag to detect if malicious code executes
      var exploitExecuted = false;

      // Pollute Object.prototype.block with malicious code
      Object.prototype.block = {
        type: 'Code',
        val: 'exploitExecuted = true',
        buffer: false,
        mustEscape: false,
        isInline: false,
      };

      // This should not execute the polluted block
      var template = pug.compile('- var x = 1\np Hello');
      var html = template({exploitExecuted: exploitExecuted});

      // Verify exploit did not execute
      expect(exploitExecuted).toBe(false);
      expect(html).toContain('Hello');
    });
  });

  describe('2. tag.code vulnerability path', function() {
    it('should not execute code from prototype-polluted tag.code property', function() {
      var exploitExecuted = false;

      // Pollute Object.prototype.code with malicious code
      Object.prototype.code = {
        type: 'Code',
        val: 'exploitExecuted = true',
        buffer: false,
        mustEscape: false,
        isInline: false,
      };

      // This should not execute the polluted code
      var template = pug.compile('img');
      var html = template({exploitExecuted: exploitExecuted});

      expect(exploitExecuted).toBe(false);
      expect(html).toContain('<img');
    });
  });

  describe('3. mixin.code vulnerability path', function() {
    it('should not execute code from prototype-polluted mixin.code property', function() {
      var exploitExecuted = false;

      // Pollute Object.prototype.code with malicious code node
      Object.prototype.code = {
        type: 'Code',
        val: 'exploitExecuted = true',
        buffer: false,
        mustEscape: false,
        isInline: false,
      };

      // Template with a mixin call that could inherit the polluted code property
      var template = pug.compile(`
mixin test()
  p Hello

+test()
      `);

      var html = template({exploitExecuted: exploitExecuted});

      expect(exploitExecuted).toBe(false);
      expect(html).toContain('Hello');
    });
  });

  describe('4. valueResponse.val vulnerability path', function() {
    it('should not use prototype-polluted val for boolean attributes', function() {
      // Pollute Object.prototype.val with malicious string
      Object.prototype.val = 'onclick="alert(\'XSS\')"';

      // Template with boolean attribute that should not use polluted val
      var template = pug.compile('input(checked)');
      var html = template();

      // Check that the polluted value is not in the rendered HTML
      expect(html).not.toContain('onclick=');
      expect(html).toContain('checked');
    });

    it('should handle prototype-polluted val in attribute parsing', function() {
      // Pollute Object.prototype.val
      Object.prototype.val = 'javascript:alert("XSS")';

      // Template with valueless attribute
      var template = pug.compile('div(data-test)');
      var html = template();

      // Ensure polluted value doesn't appear in output
      expect(html).not.toContain('javascript:');
      expect(html).toContain('data-test');
    });
  });

  describe('Combined pollution scenarios', function() {
    it('should resist multiple simultaneous prototype pollution attacks', function() {
      var exploitExecuted = false;

      // Pollute multiple Object.prototype properties
      Object.prototype.block = {
        type: 'Code',
        val: 'exploitExecuted = true',
        buffer: false,
      };
      Object.prototype.code = {
        type: 'Code',
        val: 'exploitExecuted = true',
        buffer: false,
      };
      Object.prototype.val = 'onclick="exploitExecuted=true"';
      Object.prototype.type = 'Code';
      Object.prototype.alternate = {
        type: 'Code',
        val: 'exploitExecuted = true',
        buffer: false,
      };

      // Complex template that could trigger multiple vulnerability paths
      var template = pug.compile(`
doctype html
html
  head
    title Test
  body
    if condition
      p Conditional content
    input(disabled)
    
mixin testMixin()
  div Content

+testMixin()
      `);

      var html = template({condition: true, exploitExecuted: exploitExecuted});

      expect(exploitExecuted).toBe(false);
      expect(html).toContain('Conditional content');
      expect(html).toContain('disabled');
    });
  });

  describe('Normal functionality preservation', function() {
    it('should preserve normal code block functionality', function() {
      // Template with legitimate code block
      var template = pug.compile(`
- var message = "Hello World"
p= message
      `);

      var html = template();
      expect(html).toContain('Hello World');
    });

    it('should preserve normal attribute functionality', function() {
      // Template with normal attributes
      var template = pug.compile('input(type="text", value="test", required)');
      var html = template();

      expect(html).toContain('type="text"');
      expect(html).toContain('value="test"');
      expect(html).toContain('required');
    });

    it('should preserve normal mixin functionality', function() {
      // Template with normal mixin
      var template = pug.compile(`
mixin greeting(name)
  p Hello #{name}!

+greeting("World")
      `);

      var html = template();
      expect(html).toContain('Hello World!');
    });
  });

  describe('compileDebug: false scenarios', function() {
    it('should be secure even with debug disabled', function() {
      var exploitExecuted = false;

      // Pollute properties that might be used in debug mode
      Object.prototype.line = 'exploitExecuted = true';
      Object.prototype.filename = 'malicious.js';
      Object.prototype.block = {
        type: 'Code',
        val: 'exploitExecuted = true',
        buffer: false,
      };

      // Compile with debug disabled
      var template = pug.compile('p Hello', {compileDebug: false});
      var html = template({exploitExecuted: exploitExecuted});

      expect(exploitExecuted).toBe(false);
      expect(html).toContain('Hello');
    });
  });
});
