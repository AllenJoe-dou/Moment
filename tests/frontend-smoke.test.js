const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('participant page includes upload, presets, fields, background picker, and submit flow', () => {
  const html = read('public/index.html');
  assert.match(html, /id="image-upload"/);
  assert.match(html, /id="preset-list"/);
  assert.match(html, /id="fields-container"/);
  assert.match(html, /id="submit-button"/);
  assert.match(html, /id="background-picker"/);
  assert.match(html, /一闪 Moment/);
});

test('participant styles include liquid glass presentation and responsive rules', () => {
  const css = read('public/styles.css');
  assert.match(css, /backdrop-filter/);
  assert.match(css, /@media/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.glass-card/);
});

test('background system supports four themes including pink plum particles', () => {
  const js = read('public/backgrounds.js');
  assert.match(js, /pink-plum/);
  assert.match(js, /violet-flow/);
  assert.match(js, /golden-hour/);
  assert.match(js, /ocean-bubble/);
  assert.match(js, /plum/i);
});

test('participant app wires API calls and accessible form labels', () => {
  const js = read('public/app.js');
  assert.match(js, /\/api\/config/);
  assert.match(js, /\/api\/upload/);
  assert.match(js, /\/api\/submissions/);
  assert.match(js, /aria-label/);
  assert.match(js, /FormData/);
});
