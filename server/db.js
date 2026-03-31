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
  await client.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL DEFAULT '',
        last_name TEXT NOT NULL DEFAULT '',
        company_name TEXT NOT NULL DEFAULT '',
        sector TEXT NOT NULL DEFAULT '',
        siret TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        address TEXT DEFAULT '',
        lsa_name TEXT DEFAULT '',
        assigned_to TEXT DEFAULT '',
        google_link TEXT DEFAULT '',
        has_decennale INTEGER NOT NULL DEFAULT 0,
        has_kbis INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'en_attente',
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'autre',
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        blob_url TEXT DEFAULT '',
        uploaded_by TEXT,
        uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        done INTEGER NOT NULL DEFAULT 0,
        done_by TEXT,
        done_at TEXT,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        detail TEXT,
        author TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )`,
      args: [],
    },
  ], 'write');
}

async function createDefaultTasks(clientId) {
  const client = getDb();
  const stmts = config.DEFAULT_TASKS.map((label, i) => ({
    sql: 'INSERT INTO tasks (client_id, label, sort_order) VALUES (?, ?, ?)',
    args: [clientId, label, i],
  }));
  await client.batch(stmts, 'write');
}

async function logActivity(clientId, action, detail, author) {
  const client = getDb();
  await client.execute({
    sql: 'INSERT INTO activity_log (client_id, action, detail, author) VALUES (?, ?, ?, ?)',
    args: [clientId, action, detail, author],
  });
}

module.exports = { getDb, init, createDefaultTasks, logActivity };
