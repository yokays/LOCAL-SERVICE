const express = require('express');
const router = express.Router();
const { db, logActivity } = require('../db');

// PUT /api/tasks/:id/toggle
router.put('/:id/toggle', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tâche non trouvée' });

  const newDone = task.done ? 0 : 1;
  const doneBy = newDone ? req.body.user || 'Système' : null;
  const doneAt = newDone ? new Date().toISOString() : null;

  db.prepare('UPDATE tasks SET done = ?, done_by = ?, done_at = ? WHERE id = ?').run(
    newDone,
    doneBy,
    doneAt,
    req.params.id
  );

  const action = newDone ? 'task_done' : 'task_undone';
  logActivity(task.client_id, action, task.label, req.body.user || 'Système');

  db.prepare("UPDATE clients SET updated_at = datetime('now') WHERE id = ?").run(
    task.client_id
  );

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

  const io = req.app.get('io');
  if (io)
    io.emit('task:checked', {
      task: updated,
      clientId: task.client_id,
    });

  res.json(updated);
});

// GET /api/tasks/client/:clientId
router.get('/client/:clientId', (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE client_id = ? ORDER BY sort_order')
    .all(req.params.clientId);
  res.json(tasks);
});

module.exports = router;
