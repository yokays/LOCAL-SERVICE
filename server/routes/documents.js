const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, logActivity } = require('../db');
const config = require('../config');

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(config.UPLOAD_DIR, String(req.params.clientId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (config.ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  },
});

// POST /api/documents/:clientId
router.post('/:clientId', upload.array('files', 10), (req, res) => {
  const clientId = req.params.clientId;
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
  if (!client) return res.status(404).json({ error: 'Client non trouvé' });

  const docType = req.body.type || 'autre';
  const user = req.body.user || 'Système';

  const stmt = db.prepare(
    'INSERT INTO documents (client_id, type, filename, original_name, uploaded_by) VALUES (?, ?, ?, ?, ?)'
  );

  const docs = [];
  const transaction = db.transaction(() => {
    for (const file of req.files) {
      const result = stmt.run(
        clientId,
        docType,
        file.filename,
        file.originalname,
        user
      );
      docs.push(
        db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid)
      );
      logActivity(clientId, 'doc_upload', `${file.originalname} (${docType})`, user);
    }
  });
  transaction();

  db.prepare("UPDATE clients SET updated_at = datetime('now') WHERE id = ?").run(
    clientId
  );

  const io = req.app.get('io');
  if (io) io.emit('document:uploaded', { clientId, documents: docs });

  res.status(201).json(docs);
});

// GET /api/documents/:clientId/:filename
router.get('/:clientId/:filename', (req, res) => {
  const filePath = path.join(
    config.UPLOAD_DIR,
    req.params.clientId,
    req.params.filename
  );
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }
  res.sendFile(path.resolve(filePath));
});

// DELETE /api/documents/:id
router.delete('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

  const filePath = path.join(config.UPLOAD_DIR, String(doc.client_id), doc.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  logActivity(
    doc.client_id,
    'doc_delete',
    doc.original_name,
    req.body.user || 'Système'
  );

  const io = req.app.get('io');
  if (io) io.emit('document:uploaded', { clientId: doc.client_id, deleted: doc.id });

  res.json({ success: true });
});

module.exports = router;
