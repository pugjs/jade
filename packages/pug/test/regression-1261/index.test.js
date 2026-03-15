const pug = require('../../');

// Issue 1: block append in another block append duplicates the content of the inner block append,
// in different order furthermore.
test('#1261 - issue 1 - page with nested append', () => {
  const output = pug.renderFile(
    __dirname + '/page1-issue1.pug',
    {pretty: true}
  );
  expect(output).toMatchSnapshot();
});

// Issue 2: append order is not the expected one: page 2 should be after page 1 in both script & content blocks.
test('#1261 - issue 2 - append/prepend in include', () => {
  const output = pug.renderFile(
    __dirname + '/page1-issue2.pug',
    {pretty: true}
  );
  expect(output).toMatchSnapshot();
});

// Issue 3: block scripts is duplicated like in issue 1, but the order is the same in the two copies...
test('#1261 - issue 3 - append inside include inside append content', () => {
  const output = pug.renderFile(
    __dirname + '/page1-issue3.pug',
    {pretty: true}
  );
  expect(output).toMatchSnapshot();
});
