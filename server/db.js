const { createClient } = require('@libsql/client');
const config = require('./config');

let db;

function getDb() {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:./server/lsa.db',
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  }
  return db;
}

async function init() {
  const client = getDb();
  await client.executeMultiple(`
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
      blob_url TEXT DEFAULT '',
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

  // Migrations for existing tables
  try {
    const result = await client.execute("PRAGMA table_info(clients)");
    const cols = result.rows.map(r => r.name);
    if (!cols.includes('google_link')) {
      await client.execute("ALTER TABLE clients ADD COLUMN google_link TEXT DEFAULT ''");
    }
    if (!cols.includes('has_decennale')) {
      await client.execute("ALTER TABLE clients ADD COLUMN has_decennale INTEGER NOT NULL DEFAULT 0");
    }
    if (!cols.includes('has_kbis')) {
      await client.execute("ALTER TABLE clients ADD COLUMN has_kbis INTEGER NOT NULL DEFAULT 0");
    }
    if (!cols.includes('first_name')) {
      await client.execute("ALTER TABLE clients ADD COLUMN first_name TEXT DEFAULT ''");
    }
    if (!cols.includes('last_name')) {
      await client.execute("ALTER TABLE clients ADD COLUMN last_name TEXT DEFAULT ''");
    }
    if (!cols.includes('lsa_name')) {
      await client.execute("ALTER TABLE clients ADD COLUMN lsa_name TEXT DEFAULT ''");
    }

    // Documents blob_url migration
    const docResult = await client.execute("PRAGMA table_info(documents)");
    const docCols = docResult.rows.map(r => r.name);
    if (!docCols.includes('blob_url')) {
      await client.execute("ALTER TABLE documents ADD COLUMN blob_url TEXT DEFAULT ''");
    }
  } catch (e) {
    // PRAGMA may not work on all Turso versions, ignore
  }
}

async function createDefaultTasks(clientId) {
  const client = getDb();
  const stmts = config.DEFAULT_TASKS.map((label, i) => ({
    sql: 'INSERT INTO tasks (client_id, label, sort_order) VALUES (?, ?, ?)',
    args: [clientId, label, i],
  }));
  await client.batch(stmts);
}

async function logActivity(clientId, action, detail, author) {
  const client = getDb();
  await client.execute({
    sql: 'INSERT INTO activity_log (client_id, action, detail, author) VALUES (?, ?, ?, ?)',
    args: [clientId, action, detail, author],
  });
}

module.exports = { getDb, init, createDefaultTasks, logActivity };
