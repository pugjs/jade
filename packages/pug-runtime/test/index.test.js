'use strict';

var runtime = require('../');
var build = require('../build');
var wrap = require('../wrap');

function addTest(name, fn) {
  test(name, function() {
    fn(runtime[name]);
    fn(Function('', build([name]) + ';return pug_' + name + ';')());
    fn(wrap('function t() {return pug.' + name + ';}', 't')());
  });
}

addTest('attr', function(attr) {
  // (key, val, escaped, terse)
  var stringToJSON = String.prototype.toJSON;

  String.prototype.toJSON = function() {
    return JSON.stringify(this);
  };

  // Boolean Attributes
  expect(attr('key', true, true, true)).toBe(' key');
  expect(attr('key', true, false, true)).toBe(' key');
  expect(attr('key', true, true, false)).toBe(' key="key"');
  expect(attr('key', true, false, false)).toBe(' key="key"');
  expect(attr('key', false, true, true)).toBe('');
  expect(attr('key', false, false, true)).toBe('');
  expect(attr('key', false, true, false)).toBe('');
  expect(attr('key', false, false, false)).toBe('');
  expect(attr('key', null, true, true)).toBe('');
  expect(attr('key', null, false, true)).toBe('');
  expect(attr('key', null, true, false)).toBe('');
  expect(attr('key', null, false, false)).toBe('');
  expect(attr('key', undefined, true, true)).toBe('');
  expect(attr('key', undefined, false, true)).toBe('');
  expect(attr('key', undefined, true, false)).toBe('');
  expect(attr('key', undefined, false, false)).toBe('');

  // Date Attributes
  expect(attr('key', new Date('2014-12-28T16:46:06.962Z'), true, true)).toBe(
    ' key="2014-12-28T16:46:06.962Z"'
  );
  expect(attr('key', new Date('2014-12-28T16:46:06.962Z'), false, true)).toBe(
    ' key="2014-12-28T16:46:06.962Z"'
  );
  expect(attr('key', new Date('2014-12-28T16:46:06.962Z'), true, false)).toBe(
    ' key="2014-12-28T16:46:06.962Z"'
  );
  expect(attr('key', new Date('2014-12-28T16:46:06.962Z'), false, false)).toBe(
    ' key="2014-12-28T16:46:06.962Z"'
  );

  // Custom JSON Attributes
  expect(
    attr(
      'key',
      {
        toJSON: function() {
          return 'bar';
        },
      },
      true,
      false
    )
  ).toBe(' key="bar"');
  expect(
    attr(
      'key',
      {
        toJSON: function() {
          return {foo: 'bar'};
        },
      },
      true,
      false
    )
  ).toBe(' key="{&quot;foo&quot;:&quot;bar&quot;}"');

  // JSON Attributes
  expect(attr('key', {foo: 'bar'}, true, true)).toBe(
    ' key="{&quot;foo&quot;:&quot;bar&quot;}"'
  );
  expect(attr('key', {foo: 'bar'}, false, true)).toBe(' key=\'{"foo":"bar"}\'');
  expect(attr('key', {foo: "don't"}, true, true)).toBe(
    ' key="{&quot;foo&quot;:&quot;don\'t&quot;}"'
  );
  expect(attr('key', {foo: "don't"}, false, true)).toBe(
    ' key=\'{"foo":"don&#39;t"}\''
  );

  // Number attributes
  expect(attr('key', 500, true, true)).toBe(' key="500"');
  expect(attr('key', 500, false, true)).toBe(' key="500"');
  expect(attr('key', 500, true, false)).toBe(' key="500"');
  expect(attr('key', 500, false, false)).toBe(' key="500"');

  // BigInt attributes
  expect(attr('key', BigInt(500), true, true)).toBe(' key="500"');
  expect(attr('key', BigInt(500), false, true)).toBe(' key="500"');
  expect(attr('key', BigInt(500), true, false)).toBe(' key="500"');
  expect(attr('key', BigInt(500), false, false)).toBe(' key="500"');
  // BigInt preserves precision beyond Number.MAX_SAFE_INTEGER
  expect(attr('key', BigInt('9007199254740993'), true, true)).toBe(
    ' key="9007199254740993"'
  );

  // String attributes
  expect(attr('key', 'foo', true, true)).toBe(' key="foo"');
  expect(attr('key', 'foo', false, true)).toBe(' key="foo"');
  expect(attr('key', 'foo', true, false)).toBe(' key="foo"');
  expect(attr('key', 'foo', false, false)).toBe(' key="foo"');
  expect(attr('key', 'foo>bar', true, true)).toBe(' key="foo&gt;bar"');
  expect(attr('key', 'foo>bar', false, true)).toBe(' key="foo>bar"');
  expect(attr('key', 'foo>bar', true, false)).toBe(' key="foo&gt;bar"');
  expect(attr('key', 'foo>bar', false, false)).toBe(' key="foo>bar"');

  String.prototype.toJSON = stringToJSON;
});

addTest('attrs', function(attrs) {
  // (obj, terse)
  expect(attrs({foo: 'bar'}, true)).toBe(' foo="bar"');
  expect(attrs({foo: 'bar'}, false)).toBe(' foo="bar"');
  expect(attrs({foo: 'bar', hoo: 'boo'}, true)).toBe(' foo="bar" hoo="boo"');
  expect(attrs({foo: 'bar', hoo: 'boo'}, false)).toBe(' foo="bar" hoo="boo"');
  expect(attrs({foo: ''}, true)).toBe(' foo=""');
  expect(attrs({foo: ''}, false)).toBe(' foo=""');
  expect(attrs({class: ''}, true)).toBe('');
  expect(attrs({class: ''}, false)).toBe('');
  expect(attrs({class: ['foo', {bar: true}]}, true)).toBe(' class="foo bar"');
  expect(attrs({class: ['foo', {bar: true}]}, false)).toBe(' class="foo bar"');
  expect(attrs({class: ['foo', {bar: true}], foo: 'bar'}, true)).toBe(
    ' class="foo bar" foo="bar"'
  );
  expect(attrs({foo: 'bar', class: ['foo', {bar: true}]}, false)).toBe(
    ' class="foo bar" foo="bar"'
  );
  expect(attrs({style: 'foo: bar;'}, true)).toBe(' style="foo: bar;"');
  expect(attrs({style: 'foo: bar;'}, false)).toBe(' style="foo: bar;"');
  expect(attrs({style: {foo: 'bar'}}, true)).toBe(' style="foo:bar;"');
  expect(attrs({style: {foo: 'bar'}}, false)).toBe(' style="foo:bar;"');
});

addTest('classes', function(classes) {
  expect(classes(['foo', 'bar'])).toBe('foo bar');
  expect(
    classes([
      ['foo', 'bar'],
      ['baz', 'bash'],
    ])
  ).toBe('foo bar baz bash');
  expect(classes([['foo', 'bar'], {baz: true, bash: false}])).toBe(
    'foo bar baz'
  );
  expect(
    classes([['fo<o', 'bar'], {'ba>z': true, bash: false}], [true, false])
  ).toBe('fo&lt;o bar ba>z');
});

addTest('escape', function(escape) {
  expect(escape('foo')).toBe('foo');
  expect(escape(10)).toBe(10);
  expect(escape('foo<bar')).toBe('foo&lt;bar');
  expect(escape('foo&<bar')).toBe('foo&amp;&lt;bar');
  expect(escape('foo&<>bar')).toBe('foo&amp;&lt;&gt;bar');
  expect(escape('foo&<>"bar')).toBe('foo&amp;&lt;&gt;&quot;bar');
  expect(escape('foo&<>"bar"')).toBe('foo&amp;&lt;&gt;&quot;bar&quot;');
});

addTest('merge', function(merge) {
  expect(merge({foo: 'bar'}, {baz: 'bash'})).toEqual({foo: 'bar', baz: 'bash'});
  expect(merge([{foo: 'bar'}, {baz: 'bash'}, {bing: 'bong'}])).toEqual({
    foo: 'bar',
    baz: 'bash',
    bing: 'bong',
  });
  expect(merge({class: 'bar'}, {class: 'bash'})).toEqual({
    class: ['bar', 'bash'],
  });
  expect(merge({class: ['bar']}, {class: 'bash'})).toEqual({
    class: ['bar', 'bash'],
  });
  expect(merge({class: 'bar'}, {class: ['bash']})).toEqual({
    class: ['bar', 'bash'],
  });
  expect(merge({class: 'bar'}, {class: null})).toEqual({class: ['bar']});
  expect(merge({class: null}, {class: ['bar']})).toEqual({class: ['bar']});
  expect(merge({}, {class: ['bar']})).toEqual({class: ['bar']});
  expect(merge({class: ['bar']}, {})).toEqual({class: ['bar']});

  expect(merge({style: 'foo:bar'}, {style: 'baz:bash'})).toEqual({
    style: 'foo:bar;baz:bash;',
  });
  expect(merge({style: 'foo:bar;'}, {style: 'baz:bash'})).toEqual({
    style: 'foo:bar;baz:bash;',
  });
  expect(merge({style: {foo: 'bar'}}, {style: 'baz:bash'})).toEqual({
    style: 'foo:bar;baz:bash;',
  });
  expect(merge({style: {foo: 'bar'}}, {style: {baz: 'bash'}})).toEqual({
    style: 'foo:bar;baz:bash;',
  });
  expect(merge({style: 'foo:bar'}, {style: null})).toEqual({style: 'foo:bar;'});
  expect(merge({style: 'foo:bar;'}, {style: null})).toEqual({
    style: 'foo:bar;',
  });
  expect(merge({style: {foo: 'bar'}}, {style: null})).toEqual({
    style: 'foo:bar;',
  });
  expect(merge({style: null}, {style: 'baz:bash'})).toEqual({
    style: 'baz:bash;',
  });
  expect(merge({style: null}, {style: 'baz:bash'})).toEqual({
    style: 'baz:bash;',
  });
  expect(merge({style: null}, {style: 'baz:bash'})).toEqual({
    style: 'baz:bash;',
  });
  expect(merge({}, {style: 'baz:bash'})).toEqual({style: 'baz:bash;'});
  expect(merge({}, {style: 'baz:bash'})).toEqual({style: 'baz:bash;'});
  expect(merge({}, {style: 'baz:bash'})).toEqual({style: 'baz:bash;'});
});

addTest('style', function(style) {
  expect(style(null)).toBe('');
  expect(style('')).toBe('');
  expect(style('foo: bar')).toBe('foo: bar');
  expect(style('foo: bar;')).toBe('foo: bar;');
  expect(style({foo: 'bar'})).toBe('foo:bar;');
  expect(style({foo: 'bar', baz: 'bash'})).toBe('foo:bar;baz:bash;');
});

describe('rethrow', () => {
  it('should rethrow error', () => {
    const err = new Error();
    try {
      runtime.rethrow(err, 'foo.pug', 3);
    } catch (e) {
      expect(e).toBe(err);
      return;
    }

    throw new Error('expected rethrow to throw');
  });

  it('should rethrow error with str', () => {
    const err = new Error();
    try {
      runtime.rethrow(err, 'foo.pug', 3, 'hello world');
    } catch (e) {
      expect(e).toBe(err);
      expect(e.message.trim()).toBe(
        `
foo.pug:3
    1| hello world`.trim()
      );
      return;
    }

    throw new Error('expected rethrow to throw');
  });

  it('should handle bad arguments gracefully', () => {
    const err = new Error('hello world');
    const str = {not: 'a string'};
    try {
      runtime.rethrow(err, 'foo.pug', 3, str);
    } catch (e) {
      expect(e).toBe(err);
      expect(e.message).toBe(
        'hello world - could not read from foo.pug (str.split is not a function) on line 3'
      );
      return;
    }

    throw new Error('expected rethrow to throw');
  });
});
