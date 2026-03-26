import pg from 'pg'

const { Pool } = pg

let pool

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }
    const needsSsl = connectionString.includes('sslmode=require') || process.env.NODE_ENV === 'production'
    pool = new Pool({
      connectionString,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
    })
  }
  return pool
}

async function ensureSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      product_id TEXT PRIMARY KEY,
      cap INTEGER NOT NULL,
      sold INTEGER NOT NULL DEFAULT 0,
      reserved INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES inventory(product_id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS reservations_status_idx
    ON reservations(status);
  `)
}

export async function withClient(fn) {
  const client = await getPool().connect()
  try {
    await ensureSchema(client)
    return await fn(client)
  } finally {
    client.release()
  }
}
