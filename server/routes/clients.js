const express = require('express');
const router = express.Router();
const { db, createDefaultTasks, logActivity } = require('../db');

// GET /api/clients
router.get('/', (req, res) => {
  const { status, sector, assigned_to, search } = req.query;
  let sql = 'SELECT * FROM clients WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (sector) {
    sql += ' AND sector = ?';
    params.push(sector);
  }
  if (assigned_to) {
    sql += ' AND assigned_to = ?';
    params.push(assigned_to);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR company_name LIKE ? OR siret LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ' ORDER BY created_at DESC';
  const clients = db.prepare(sql).all(...params);
  res.json(clients);
});

// GET /api/clients/stats
router.get('/stats', (_req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM clients').get().c;
  const stats = db
    .prepare('SELECT status, COUNT(*) as c FROM clients GROUP BY status')
    .all();
  const byStatus = {};
  stats.forEach((s) => (byStatus[s.status] = s.c));
  res.json({ total, byStatus });
});

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client non trouvé' });

  const tasks = db
    .prepare('SELECT * FROM tasks WHERE client_id = ? ORDER BY sort_order')
    .all(req.params.id);
  const documents = db
    .prepare('SELECT * FROM documents WHERE client_id = ? ORDER BY uploaded_at DESC')
    .all(req.params.id);
  const activity = db
    .prepare(
      'SELECT * FROM activity_log WHERE client_id = ? ORDER BY created_at DESC LIMIT 50'
    )
    .all(req.params.id);

  res.json({ ...client, tasks, documents, activity });
});

// POST /api/clients
router.post('/', (req, res) => {
  const {
    first_name,
    last_name,
    company_name,
    sector,
    siret,
    phone,
    address,
    lsa_name,
    assigned_to,
    google_link,
    has_decennale,
    has_kbis,
    notes,
    user,
  } = req.body;

  if (!first_name || !last_name || !company_name || !sector) {
    return res.status(400).json({ error: 'Prénom, nom, entreprise et secteur requis' });
  }

  const result = db
    .prepare(
      `INSERT INTO clients (first_name, last_name, company_name, sector, siret, phone, address, lsa_name, assigned_to, google_link, has_decennale, has_kbis, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      first_name,
      last_name,
      company_name,
      sector,
      siret || '',
      phone || '',
      address || '',
      lsa_name || '',
      assigned_to || '',
      google_link || '',
      has_decennale ? 1 : 0,
      has_kbis ? 1 : 0,
      notes || ''
    );

  createDefaultTasks(result.lastInsertRowid);
  logActivity(
    result.lastInsertRowid,
    'creation',
    `Client créé`,
    user || 'Système'
  );

  const client = db
    .prepare('SELECT * FROM clients WHERE id = ?')
    .get(result.lastInsertRowid);

  const io = req.app.get('io');
  if (io) io.emit('client:updated', { type: 'created', client });

  res.status(201).json(client);
});

// PUT /api/clients/:id
router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM clients WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Client non trouvé' });

  const fields = [
    'first_name',
    'last_name',
    'company_name',
    'sector',
    'siret',
    'phone',
    'address',
    'lsa_name',
    'google_link',
    'has_decennale',
    'has_kbis',
    'assigned_to',
    'status',
    'notes',
  ];
  const updates = [];
  const params = [];
  const changes = [];

  fields.forEach((f) => {
    if (req.body[f] !== undefined && req.body[f] !== existing[f]) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
      changes.push(`${f}: ${existing[f]} → ${req.body[f]}`);
    }
  });

  if (updates.length === 0) {
    return res.json(existing);
  }

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`).run(
    ...params
  );

  changes.forEach((c) => {
    logActivity(req.params.id, 'update', c, req.body.user || 'Système');
  });

  const client = db
    .prepare('SELECT * FROM clients WHERE id = ?')
    .get(req.params.id);

  const io = req.app.get('io');
  if (io) io.emit('client:updated', { type: 'updated', client });

  res.json(client);
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM clients WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Client non trouvé' });

  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);

  const io = req.app.get('io');
  if (io)
    io.emit('client:updated', { type: 'deleted', clientId: req.params.id });

  res.json({ success: true });
});

module.exports = router;
