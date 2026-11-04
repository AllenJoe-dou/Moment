const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const { createApp } = require('../server');

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

async function withServer(run) {
  const dataDir = tempDir('yishan-api-data-');
  const uploadsDir = tempDir('yishan-api-uploads-');
  const app = createApp({ dataDir, uploadsDir });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(baseUrl, { dataDir, uploadsDir });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('API reads and updates config', async () => {
  await withServer(async (baseUrl) => {
    const getResponse = await fetch(`${baseUrl}/api/config`);
    assert.equal(getResponse.status, 200);
    const config = await getResponse.json();
    assert.equal(config.title, '一闪 Moment');

    config.title = '今晚的 Moment';
    const putResponse = await fetch(`${baseUrl}/api/config`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(config)
    });
    assert.equal(putResponse.status, 200);

    const updated = await (await fetch(`${baseUrl}/api/config`)).json();
    assert.equal(updated.title, '今晚的 Moment');
  });
});

test('API uploads an image and stores a submission', async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append('image', new Blob(['fake-image'], { type: 'image/png' }), 'moment.png');
    const uploadResponse = await fetch(`${baseUrl}/api/upload`, { method: 'POST', body: form });
    assert.equal(uploadResponse.status, 201);
    const upload = await uploadResponse.json();
    assert.match(upload.url, /^\/uploads\//);

    const invalidResponse = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers: { message: '', mood: '' }, background: 'pink-plum' })
    });
    assert.equal(invalidResponse.status, 400);

    const submitResponse = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        imageId: 'plum-window',
        imageUrl: '/presets/plum-window.svg',
        background: 'pink-plum',
        answers: { message: '记得这一刻', mood: 'warm', tags: ['memory'] }
      })
    });
    assert.equal(submitResponse.status, 201);
    const created = await submitResponse.json();
    assert.ok(created.id);

    const listResponse = await fetch(`${baseUrl}/api/submissions`);
    const submissions = await listResponse.json();
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0].answers.message, '记得这一刻');
  });
});

test('API exports submissions as CSV', async () => {
  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        imageId: 'plum-window',
        background: 'pink-plum',
        answers: { message: '一行,带逗号', mood: 'warm', tags: ['memory'] }
      })
    });

    const response = await fetch(`${baseUrl}/api/submissions/export.csv`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-disposition'), /attachment/);
    const csv = await response.text();
    assert.match(csv, /提交时间/);
    assert.match(csv, /"一行,带逗号"/);
  });
});
