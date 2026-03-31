const express = require('express');
const cors = require('cors');
const { init } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Static routes that don't need DB (load fast)
app.use('/api/users', require('./routes/users'));
app.use('/api/config', require('./routes/users'));

// Init DB lazily on first DB-requiring request
let dbInitialized = false;
async function ensureDb(_req, _res, next) {
  if (!dbInitialized) {
    try {
      await init();
      dbInitialized = true;
    } catch (e) {
      console.error('DB init error:', e);
      return _res.status(500).json({ error: 'Database initialization failed: ' + e.message });
    }
  }
  next();
}

// DB-requiring routes
app.use('/api/clients', ensureDb, require('./routes/clients'));
app.use('/api/tasks', ensureDb, require('./routes/tasks'));
app.use('/api/documents', ensureDb, require('./routes/documents'));

// Local dev server
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = require('./config').PORT;
  app.listen(PORT, () => {
    console.log(`Serveur LSA démarré sur http://localhost:${PORT}`);
  });
}

module.exports = app;
