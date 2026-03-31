const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config');

const db = new Database(path.join(__dirname, 'lsa.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      sector TEXT NOT NULL,
      siret TEXT,
      phone TEXT,
      address TEXT,
      lsa_name TEXT DEFAULT '',
      assigned_to TEXT,
      google_link TEXT DEFAULT '',
      has_decennale INTEGER NOT NULL DEFAULT 0,
      has_kbis INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'en_attente',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'autre',
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      uploaded_by TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      done INTEGER NOT NULL DEFAULT 0,
      done_by TEXT,
      done_at TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      author TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);

  // Migrate existing tables — add new columns if missing
  const cols = db.prepare("PRAGMA table_info(clients)").all().map(c => c.name);
  if (!cols.includes('google_link')) {
    db.exec("ALTER TABLE clients ADD COLUMN google_link TEXT DEFAULT ''");
  }
  if (!cols.includes('has_decennale')) {
    db.exec("ALTER TABLE clients ADD COLUMN has_decennale INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.includes('has_kbis')) {
    db.exec("ALTER TABLE clients ADD COLUMN has_kbis INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.includes('first_name')) {
    db.exec("ALTER TABLE clients ADD COLUMN first_name TEXT DEFAULT ''");
  }
  if (!cols.includes('last_name')) {
    db.exec("ALTER TABLE clients ADD COLUMN last_name TEXT DEFAULT ''");
  }
  if (!cols.includes('lsa_name')) {
    db.exec("ALTER TABLE clients ADD COLUMN lsa_name TEXT DEFAULT ''");
  }
  // Migrate old 'name' field to first_name for existing rows
  if (cols.includes('name') && cols.includes('first_name')) {
    db.exec("UPDATE clients SET first_name = name WHERE first_name = '' AND name != ''");
  }
}

function createDefaultTasks(clientId) {
  const stmt = db.prepare(
    'INSERT INTO tasks (client_id, label, sort_order) VALUES (?, ?, ?)'
  );
  const transaction = db.transaction(() => {
    config.DEFAULT_TASKS.forEach((label, i) => {
      stmt.run(clientId, label, i);
    });
  });
  transaction();
}

function logActivity(clientId, action, detail, author) {
  db.prepare(
    'INSERT INTO activity_log (client_id, action, detail, author) VALUES (?, ?, ?, ?)'
  ).run(clientId, action, detail, author);
}

module.exports = { db, init, createDefaultTasks, logActivity };
