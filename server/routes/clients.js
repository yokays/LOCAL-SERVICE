const express = require('express');
const router = express.Router();
const { getDb, createDefaultTasks, logActivity } = require('../db');

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { status, sector, assigned_to, search } = req.query;
    let sql = 'SELECT * FROM clients WHERE 1=1';
    const args = [];

    if (status) { sql += ' AND status = ?'; args.push(status); }
    if (sector) { sql += ' AND sector = ?'; args.push(sector); }
    if (assigned_to) { sql += ' AND assigned_to = ?'; args.push(assigned_to); }
    if (search) {
      sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR company_name LIKE ? OR siret LIKE ?)';
      const s = `%${search}%`;
      args.push(s, s, s, s);
    }

    sql += ' ORDER BY created_at DESC';
    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/clients/stats
router.get('/stats', async (_req, res) => {
  try {
    const db = getDb();
    const total = (await db.execute('SELECT COUNT(*) as c FROM clients')).rows[0].c;
    const stats = (await db.execute('SELECT status, COUNT(*) as c FROM clients GROUP BY status')).rows;
    const byStatus = {};
    stats.forEach((s) => (byStatus[s.status] = s.c));
    res.json({ total, byStatus });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const client = (await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [req.params.id] })).rows[0];
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });

    const tasks = (await db.execute({ sql: 'SELECT * FROM tasks WHERE client_id = ? ORDER BY sort_order', args: [req.params.id] })).rows;
    const documents = (await db.execute({ sql: 'SELECT * FROM documents WHERE client_id = ? ORDER BY uploaded_at DESC', args: [req.params.id] })).rows;
    const activity = (await db.execute({ sql: 'SELECT * FROM activity_log WHERE client_id = ? ORDER BY created_at DESC LIMIT 50', args: [req.params.id] })).rows;

    res.json({ ...client, tasks, documents, activity });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const {
      first_name, last_name, company_name, sector, siret, phone,
      address, lsa_name, assigned_to, google_link, has_decennale, has_kbis, notes, user,
    } = req.body;

    if (!first_name || !last_name || !company_name || !sector) {
      return res.status(400).json({ error: 'Prénom, nom, entreprise et secteur requis' });
    }

    const result = await db.execute({
      sql: `INSERT INTO clients (first_name, last_name, company_name, sector, siret, phone, address, lsa_name, assigned_to, google_link, has_decennale, has_kbis, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [first_name, last_name, company_name, sector, siret || '', phone || '', address || '', lsa_name || '', assigned_to || '', google_link || '', has_decennale ? 1 : 0, has_kbis ? 1 : 0, notes || ''],
    });

    const clientId = Number(result.lastInsertRowid);
    await createDefaultTasks(clientId);
    await logActivity(clientId, 'creation', 'Client créé', user || 'Système');

    const client = (await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [clientId] })).rows[0];
    res.status(201).json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const existing = (await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [req.params.id] })).rows[0];
    if (!existing) return res.status(404).json({ error: 'Client non trouvé' });

    const fields = [
      'first_name', 'last_name', 'company_name', 'sector', 'siret', 'phone',
      'address', 'lsa_name', 'google_link', 'has_decennale', 'has_kbis',
      'assigned_to', 'status', 'notes',
    ];
    const updates = [];
    const args = [];
    const changes = [];

    fields.forEach((f) => {
      if (req.body[f] !== undefined && req.body[f] !== existing[f]) {
        updates.push(`${f} = ?`);
        args.push(req.body[f]);
        changes.push(`${f}: ${existing[f]} → ${req.body[f]}`);
      }
    });

    if (updates.length === 0) return res.json(existing);

    updates.push("updated_at = datetime('now')");
    args.push(req.params.id);

    await db.execute({ sql: `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`, args });

    for (const c of changes) {
      await logActivity(req.params.id, 'update', c, req.body.user || 'Système');
    }

    const client = (await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [req.params.id] })).rows[0];
    res.json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const existing = (await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [req.params.id] })).rows[0];
    if (!existing) return res.status(404).json({ error: 'Client non trouvé' });

    await db.execute({ sql: 'DELETE FROM clients WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
