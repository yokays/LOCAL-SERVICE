const express = require('express');
const router = express.Router();
const config = require('../config');

// GET /api/users
router.get('/', (_req, res) => {
  res.json(config.USERS);
});

// GET /api/config
router.get('/config', (_req, res) => {
  res.json({
    sectors: config.SECTORS,
    statuses: config.STATUSES,
    docTypes: ['décennale', 'kbis', 'siret', 'carte_identite', 'autre'],
  });
});

module.exports = router;
