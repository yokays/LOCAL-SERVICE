const express = require('express');
const router = express.Router();
const { getDb, logActivity } = require('../db');

// PUT /api/tasks/:id/toggle
router.put('/:id/toggle', async (req, res) => {
  try {
    const db = getDb();
    const task = (await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [req.params.id] })).rows[0];
    if (!task) return res.status(404).json({ error: 'Tâche non trouvée' });

    const newDone = task.done ? 0 : 1;
    const doneBy = newDone ? req.body.user || 'Système' : null;
    const doneAt = newDone ? new Date().toISOString() : null;

    await db.execute({
      sql: 'UPDATE tasks SET done = ?, done_by = ?, done_at = ? WHERE id = ?',
      args: [newDone, doneBy, doneAt, req.params.id],
    });

    const action = newDone ? 'task_done' : 'task_undone';
    await logActivity(task.client_id, action, task.label, req.body.user || 'Système');
    await db.execute({ sql: "UPDATE clients SET updated_at = datetime('now') WHERE id = ?", args: [task.client_id] });

    const updated = (await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [req.params.id] })).rows[0];
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tasks/client/:clientId
router.get('/client/:clientId', async (req, res) => {
  try {
    const db = getDb();
    const tasks = (await db.execute({ sql: 'SELECT * FROM tasks WHERE client_id = ? ORDER BY sort_order', args: [req.params.clientId] })).rows;
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
