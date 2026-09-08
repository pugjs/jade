'use strict';

// Regression tests: AST field reads in code generation must not pick up
// prototype-polluted values (issue #3414 class).
//
// pug tag nodes never carry an own `code` property (the parser only produces
// `code` on Code/expression nodes, which reach the compiler through different
// visitors). Before the fix, `Compiler.prototype.visitTag` read `tag.code`
// directly, so a single `Object.prototype.code = {...}` pollution turned every
// ordinary render of any tag (`p hello`) into arbitrary JS execution on the
// server (RCE). Reads are now guarded with hasOwnProperty.

const pug = require('../');

function pollute(key, value) {
  Object.prototype[key] = value;
}
function clean(key) {
  delete Object.prototype[key];
}

test('prototype-polluted `code` on Object.prototype is not compiled (RCE guard)', () => {
  pollute('code', {
    type: 'Code',
    val: 'throw new Error("PWNED_VIA_PROTO_CODE")',
    buffer: false,
    line: 1,
    column: 1,
  });
  try {
    const out = pug.render('p hello', {});
    // The pollution must have no effect: rendering succeeds and output is clean.
    expect(out).toEqual('<p>hello</p>');
  } finally {
    clean('code');
  }
});

test('prototype-polluted `code` does not trigger the self-closing error path', () => {
  pollute('code', {
    type: 'Code',
    val: 'x',
    buffer: false,
    line: 1,
    column: 1,
  });
  try {
    // `img` is self-closing; before the guard, the polluted `code` made pug
    // believe the tag had nested content and threw SELF_CLOSING_CONTENT.
    const out = pug.render('img(src="/x")', {});
    expect(out).toEqual('<img src="/x"/>');
  } finally {
    clean('code');
  }
});

test('own `code`-style code still works via normal syntax (no false positive)', () => {
  // `p= expr` uses a Code expression with buffer=true — unrelated visitor,
  // must keep working.
  expect(pug.render('p= 1 + 1', {})).toEqual('<p>2</p>');
  // unbuffered code blocks (`-`) must keep working
  expect(pug.render('- var x = 2\np= x * 3', {})).toEqual('<p>6</p>');
});

test('ordinary renders are unaffected while Object.prototype is polluted elsewhere', () => {
  pollute('__test_pug_field', 'polluted');
  try {
    expect(pug.render('a(href="/x") link', {})).toEqual('<a href="/x">link</a>');
    expect(pug.render('ul\n  li a\n  li b', {})).toEqual('<ul><li>a</li><li>b</li></ul>');
  } finally {
    clean('__test_pug_field');
  }
});
