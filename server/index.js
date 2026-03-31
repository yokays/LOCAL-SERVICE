const express = require('express');
const cors = require('cors');
const { init } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Init DB on first request
let dbInitialized = false;
app.use(async (_req, _res, next) => {
  if (!dbInitialized) {
    await init();
    dbInitialized = true;
  }
  next();
});

// Routes
app.use('/api/clients', require('./routes/clients'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/users', require('./routes/users'));
app.use('/api/config', require('./routes/users'));

// Local dev server
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = require('./config').PORT;
  app.listen(PORT, () => {
    console.log(`Serveur LSA démarré sur http://localhost:${PORT}`);
  });
}

module.exports = app;
