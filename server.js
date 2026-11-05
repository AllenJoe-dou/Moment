'use strict';

const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');

const { loadConfig, saveConfig, addSubmission, listSubmissions } = require('./lib/store');
const { validateSubmission } = require('./lib/validate');

const projectRoot = __dirname;

function safeExtension(originalName, mimetype) {
  const allowed = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg'
  };
  const ext = path.extname(originalName || '').toLowerCase();
  return allowed[mimetype] || (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext) ? ext : '.png');
}

function csvCell(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function answerText(field, value) {
  if (field.type === 'text') {
    return typeof value === 'string' ? value : '';
  }
  const values = Array.isArray(value) ? value : (value ? [value] : []);
  return values
    .map((id) => (field.options || []).find((option) => option.id === id)?.label || id)
    .join(' / ');
}

function createApp(options = {}) {
  const dataDir = options.dataDir || process.env.YISHAN_DATA_DIR || path.join(projectRoot, 'data');
  const uploadsDir = options.uploadsDir || process.env.YISHAN_UPLOADS_DIR || path.join(projectRoot, 'uploads');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });

  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(express.static(path.join(projectRoot, 'public')));
  app.use('/uploads', express.static(uploadsDir));

  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (req, file, callback) => {
        callback(null, `${Date.now()}-${crypto.randomUUID()}${safeExtension(file.originalname, file.mimetype)}`);
      }
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.startsWith('image/')) {
        callback(new Error('只能上传图片文件'));
        return;
      }
      callback(null, true);
    }
  });

  app.get('/api/config', (req, res) => {
    res.json(loadConfig(dataDir));
  });

  app.put('/api/config', (req, res) => {
    const config = req.body;
    if (!config || typeof config !== 'object' || !Array.isArray(config.fields) || !Array.isArray(config.images)) {
      res.status(400).json({ error: '配置格式不正确' });
      return;
    }
    res.json(saveConfig(config, dataDir));
  });

  app.get('/api/qr.png', async (req, res) => {
    const text = String(req.query.text || '');
    try {
      const url = new URL(text);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid protocol');
      const qr = await QRCode.toBuffer(url.toString(), {
        type: 'png',
        width: 1024,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
      res.setHeader('content-type', 'image/png');
      res.setHeader('cache-control', 'no-store');
      res.send(qr);
    } catch {
      res.status(400).json({ error: '二维码地址必须是有效的 http 或 https URL' });
    }
  });
  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: '请选择图片' });
      return;
    }
    res.status(201).json({
      id: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname
    });
  });

  app.post('/api/submissions', (req, res) => {
    const config = loadConfig(dataDir);
    const result = validateSubmission(req.body || {}, config);
    if (!result.ok) {
      res.status(400).json({ error: '提交内容不完整', errors: result.errors });
      return;
    }

    const body = req.body || {};
    const displayImage = (config.images || []).find((image) => image.id === config.displayImageId) || (config.images || [])[0];
    const submission = addSubmission({
      background: body.background || config.background,
      image: displayImage ? {
        id: displayImage.id,
        url: displayImage.url,
        label: displayImage.label,
        kind: displayImage.url.startsWith('/uploads/') ? 'upload' : 'preset'
      } : null,
      answers: body.answers || {},
      userAgent: req.get('user-agent') || ''
    }, dataDir);

    res.status(201).json(submission);
  });

  app.get('/api/submissions', (req, res) => {
    res.json(listSubmissions(dataDir));
  });

  app.get('/api/submissions/export.csv', (req, res) => {
    const config = loadConfig(dataDir);
    const submissions = listSubmissions(dataDir);
    const headers = ['提交ID', '提交时间', '背景', '图片', ...config.fields.map((field) => field.label)];
    const rows = submissions.map((submission) => [
      submission.id,
      submission.createdAt,
      submission.background,
      submission.image?.label || '',
      ...config.fields.map((field) => answerText(field, submission.answers?.[field.id]))
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', 'attachment; filename="yishan-moment-submissions.csv"');
    res.send(csv);
  });

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(projectRoot, 'public', 'admin.html'));
  });

  app.get('/admin/edit', (req, res) => {
    res.sendFile(path.join(projectRoot, 'public', 'admin-edit.html'));
  });

  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError || error.message === '只能上传图片文件') {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: '服务器处理失败' });
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, '0.0.0.0', () => {
    console.log(`一闪 Moment is running at http://localhost:${port}`);
  });
}

module.exports = { createApp };



