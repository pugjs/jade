const pug = require('../../');

describe('Inproper Usage', () => {
  test('Only left-side bracket', () => {
    expect(() => pug.compileFile(__dirname + '/error/left-side.pug')).toThrow(
      'The value variable for each must either be a valid identifier (e.g. `item`) or a pair of identifiers in square brackets (e.g. `[key, value]`).'
    );
  });
  test('Only right-side bracket', () => {
    expect(() => pug.compileFile(__dirname + '/error/right-side.pug')).toThrow(
      'The value variable for each must either be a valid identifier (e.g. `item`) or a pair of identifiers in square brackets (e.g. `[key, value]`).'
    );
  });
  test('Only one value inside brackets', () => {
    expect(() => pug.compileFile(__dirname + '/error/one-val.pug')).toThrow(
      'The value variable for each must either be a valid identifier (e.g. `item`) or a pair of identifiers in square brackets (e.g. `[key, value]`).'
    );
  });
  test('No brackets', () => {
    expect(() => pug.compileFile(__dirname + '/error/no-brackets.pug')).toThrow(
      'The value variable for each must either be a valid identifier (e.g. `item`) or a pair of identifiers in square brackets (e.g. `[key, value]`).'
    );
  });
});
describe('Proper Usage', () => {
  test('Brackets', () => {
    const html = pug.renderFile(__dirname + '/passing/brackets.pug', {
      users: new Map([
        ['a', 'b'],
        ['foo', 'bar'],
      ]),
    });
    html = expect(html).toMatchSnapshot();
  });
  test('No Brackets', () => {
    const html = pug.renderFile(__dirname + '/passing/no-brackets.pug', {
      users: new Map([
        ['a', 'b'],
        ['foo', 'bar'],
      ]),
    });
    expect(html).toMatchSnapshot();
  });
});
