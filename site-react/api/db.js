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
  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      payment_intent_id TEXT,
      customer_email TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      shipping_name TEXT,
      shipping_phone TEXT,
      shipping_address JSONB,
      billing_address JSONB,
      currency TEXT,
      amount_subtotal INTEGER,
      amount_total INTEGER,
      payment_status TEXT,
      notified_at TIMESTAMPTZ,
      notification_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      price_id TEXT,
      product_id TEXT,
      title TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_amount INTEGER,
      amount_subtotal INTEGER,
      amount_total INTEGER,
      currency TEXT,
      product_metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS order_items_order_id_idx
    ON order_items(order_id);
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
