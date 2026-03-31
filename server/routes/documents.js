const express = require('express');
const router = express.Router();
const multer = require('multer');
const { put, del } = require('@vercel/blob');
const { getDb, logActivity } = require('../db');
const config = require('../config');

// Use memory storage for Vercel (no local filesystem)
const upload = multer({
  storage: multer.memoryStorage(),
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
router.post('/:clientId', upload.array('files', 10), async (req, res) => {
  try {
    const db = getDb();
    const clientId = req.params.clientId;
    const client = (await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [clientId] })).rows[0];
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });

    const docType = req.body.type || 'autre';
    const user = req.body.user || 'Système';
    const docs = [];

    for (const file of req.files) {
      // Upload to Vercel Blob
      const blobName = `clients/${clientId}/${Date.now()}-${file.originalname}`;
      const blob = await put(blobName, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
      });

      const result = await db.execute({
        sql: 'INSERT INTO documents (client_id, type, filename, original_name, blob_url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
        args: [clientId, docType, blobName, file.originalname, blob.url, user],
      });

      const doc = (await db.execute({ sql: 'SELECT * FROM documents WHERE id = ?', args: [Number(result.lastInsertRowid)] })).rows[0];
      docs.push(doc);
      await logActivity(clientId, 'doc_upload', `${file.originalname} (${docType})`, user);
    }

    await db.execute({ sql: "UPDATE clients SET updated_at = datetime('now') WHERE id = ?", args: [clientId] });
    res.status(201).json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = (await db.execute({ sql: 'SELECT * FROM documents WHERE id = ?', args: [req.params.id] })).rows[0];
    if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

    // Delete from Vercel Blob
    if (doc.blob_url) {
      try { await del(doc.blob_url); } catch (_) { /* ignore blob deletion errors */ }
    }

    await db.execute({ sql: 'DELETE FROM documents WHERE id = ?', args: [req.params.id] });
    await logActivity(doc.client_id, 'doc_delete', doc.original_name, req.body.user || 'Système');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
