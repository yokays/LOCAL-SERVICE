module.exports = {
  PORT: 3001,
  UPLOAD_DIR: './server/uploads',
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_MIMES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  USERS: [
    { name: 'Noah', role: 'admin' },
    { name: 'Aaron', role: 'admin' },
  ],
  SECTORS: [
    'toiture',
    'abattage',
    'maçonnerie',
    'plomberie',
    'électricité',
    'peinture',
    'menuiserie',
    'serrurerie',
    'climatisation',
    'autre',
  ],
  STATUSES: ['en_attente', 'en_cours', 'compte_cree', 'en_ligne', 'bloque'],
  DEFAULT_TASKS: [
    'Réception décennale',
    'Réception KBIS',
    'Réception SIRET',
    'Création compte LSA Google',
    'Vérification identité Google',
    'Paramétrage budget & zones',
    'Activation campagne',
    'Premier lead reçu',
  ],
};
