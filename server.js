// server.js
const archiver = require('archiver');
const express  = require('express');
const multer   = require('multer');
const fs       = require('fs');
const path     = require('path');
const cors     = require('cors');
const app      = express();

/* ─────── Configuration ─────── */
const port      = process.argv[2] || 3001;              // 1st CLI arg
const PASSCODE  = process.env.PASSCODE || process.argv[3] || 'changeme'; // 2nd CLI arg

/* ─────── Ensure /uploads exists or archive old one ─────── */
const uploadsDir = path.join(__dirname, 'uploads');
fs.access(uploadsDir, fs.constants.F_OK, (err) => {
  if (err) {
    console.log('Creating uploads directory…');
    fs.mkdirSync(uploadsDir);
  } else {
    const timestamp  = new Date().toISOString().replace(/[-:.]/g, '');
    const archiveDir = path.join(__dirname, `archive_${timestamp}`);
    console.log(`Archiving existing uploads to ${archiveDir}…`);
    fs.renameSync(uploadsDir, archiveDir);
    fs.mkdirSync(uploadsDir);
  }
});

/* ─────── Multer setup ─────── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename:    (_req, file, cb)  => cb(null, file.originalname)
});
const upload = multer({ storage });

/* ─────── Middleware ─────── */
// CORS + parsing
app.use(cors());
app.use(express.json());           // so we can read JSON bodies
app.use(express.static('public')); // serves index.html etc.

// Simple pass-code guard
function authMiddleware(req, res, next) {
  const supplied =
        req.headers['x-passcode'] ||
        (req.query.passcode    ?? null) ||
        (req.body?.passcode    ?? null);

  if (supplied === PASSCODE) return next();

  console.warn(`Unauthorized access from ${req.ip}`);
  return res.status(401).json({ message: 'Invalid or missing pass-code' });
}

/* ─────── Routes (all protected except index.html) ─────── */
app.post('/upload', authMiddleware, upload.array('files'), (req, res) => {
  console.log('Files uploaded:', req.files.map(f => f.originalname));
  res.json({ message: 'Files uploaded successfully' });
});

app.get('/files', authMiddleware, (_req, res) => {
  fs.readdir('uploads/', (err, files) =>
    err ? res.status(500).json({ message: 'Error reading files' })
        : res.json(files)
  );
});

app.get('/uploads/:filename', authMiddleware, (req, res) => {
  const filepath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filepath);
});

app.get('/download-all', authMiddleware, (_req, res) => {
  res.setHeader('Content-Type',        'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=all-files.zip');

  const zip = archiver('zip', { zlib: { level: 9 } });
  zip.pipe(res);

  fs.readdir('uploads/', (err, files) => {
    if (err) return res.status(500).send('Error preparing download');
    files.forEach(f => zip.file(path.join('uploads', f), { name: f }));
    zip.finalize();
  });
});

/* ─────── Public home page (no pass-code) ─────── */
app.get('/', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

/* ─────── Start server ─────── */
app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}\nPass-code required: ${PASSCODE}`)
);
