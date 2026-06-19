import crypto from 'crypto'
import { withClient } from './db.js'

const MIN_RESERVATION_TTL_MINUTES = 31
const DEFAULT_RESERVATION_TTL_MINUTES = 31

function normalizeReservationIds(ids) {
  const input = Array.isArray(ids) ? ids : []
  return [...new Set(input.filter(Boolean))]
}

function reservationTtlMinutes() {
  const configured = Number.parseInt(process.env.RESERVATION_TTL_MINUTES || '', 10)
  if (!Number.isInteger(configured) || configured <= 0) return DEFAULT_RESERVATION_TTL_MINUTES
  return Math.max(configured, MIN_RESERVATION_TTL_MINUTES)
}

export function reservationExpiresAt(now = new Date()) {
  return new Date(now.getTime() + reservationTtlMinutes() * 60 * 1000)
}

function aggregateQuantities(rows) {
  const aggregated = new Map()
  for (const row of rows) {
    const quantity = Number.parseInt(row.quantity, 10)
    if (!row.product_id || !Number.isInteger(quantity) || quantity <= 0) continue
    aggregated.set(row.product_id, (aggregated.get(row.product_id) || 0) + quantity)
  }
  return aggregated
}

async function adjustInventory(client, rows) {
  if (!rows.length) return

  const aggregated = aggregateQuantities(rows)
  if (!aggregated.size) return

  const productIds = Array.from(aggregated.keys())
  const quantities = productIds.map((id) => aggregated.get(id))
  await client.query(
    `UPDATE inventory AS i
     SET reserved = GREATEST(i.reserved - r.quantity, 0),
         updated_at = NOW()
     FROM (SELECT product_id, quantity FROM UNNEST($1::text[], $2::int[]) AS t(product_id, quantity)) AS r
     WHERE i.product_id = r.product_id`,
    [productIds, quantities]
  )
}

async function cleanupExpiredReservationsForClient(client) {
  const ttlMinutes = reservationTtlMinutes()
  const { rows } = await client.query(
    `UPDATE reservations
     SET status = 'expired'
     WHERE status = 'reserved'
       AND (
         expires_at <= NOW()
         OR (expires_at IS NULL AND created_at < NOW() - ($1::int * INTERVAL '1 minute'))
       )
     RETURNING product_id, quantity`,
    [ttlMinutes]
  )

  await adjustInventory(client, rows)
  return rows.length
}

export async function cleanupExpiredReservations() {
  let released = 0
  await withClient(async (client) => {
    await client.query('BEGIN')
    try {
      released = await cleanupExpiredReservationsForClient(client)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
  return released
}

export async function reserveInventory(requests, options = {}) {
  const normalized = Array.isArray(requests) ? requests.filter(Boolean) : []
  if (normalized.length === 0) return []

  const reservations = []
  const expiresAt = options?.expiresAt instanceof Date ? options.expiresAt : reservationExpiresAt()
  await withClient(async (client) => {
    await client.query('BEGIN')
    try {
      await cleanupExpiredReservationsForClient(client)

      for (const request of normalized) {
        if (typeof request.productId !== 'string' || !request.productId) continue

        const cap = Number.parseInt(request.cap, 10)
        if (!Number.isInteger(cap) || cap <= 0) continue
        
        const quantity = request.quantity
        if (!Number.isInteger(quantity) || quantity <= 0) continue

        await client.query(
          `INSERT INTO inventory (product_id, sku, cap)
           VALUES ($1, $2, $3)
           ON CONFLICT (product_id) DO UPDATE
           SET sku = COALESCE(EXCLUDED.sku, inventory.sku),
               cap = EXCLUDED.cap,
               updated_at = NOW()`,
          [request.productId, request.sku || null, cap]
        )

        const { rows } = await client.query(
          `SELECT cap, sold, reserved
           FROM inventory
           WHERE product_id = $1
           FOR UPDATE`,
          [request.productId]
        )
        const row = rows[0]
        if (!row) {
          throw new Error('Inventory record not found')
        }
        const available = row.cap - row.sold - row.reserved
        if (available < quantity) {
          throw new Error('Insufficient inventory for limited edition')
        }

        const reservationId = crypto.randomUUID()
        await client.query(
          `INSERT INTO reservations (id, product_id, quantity, status, expires_at)
           VALUES ($1, $2, $3, 'reserved', $4)`,
          [reservationId, request.productId, quantity, expiresAt]
        )
        await client.query(
          `UPDATE inventory
           SET reserved = reserved + $1, updated_at = NOW()
           WHERE product_id = $2`,
          [quantity, request.productId]
        )
        reservations.push({
          id: reservationId,
          productId: request.productId,
          quantity,
        })
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })

  return reservations
}

export async function finalizeReservations(ids) {
  const reservationIds = normalizeReservationIds(ids)
  if (!reservationIds.length) return

  await withClient(async (client) => {
    await client.query('BEGIN')
    try {
      const { rows } = await client.query(
        `WITH target AS (
           SELECT id, product_id, quantity, status AS previous_status
           FROM reservations
           WHERE id = ANY($1) AND status IN ('reserved', 'expired')
           FOR UPDATE
         ),
         updated AS (
           UPDATE reservations AS r
           SET status = 'completed'
           FROM target
           WHERE r.id = target.id
           RETURNING target.product_id, target.quantity, target.previous_status
         )
         SELECT product_id, quantity, previous_status
         FROM updated`,
        [reservationIds]
      )
      if (rows.length > 0) {
        const aggregated = new Map()
        for (const row of rows) {
          const current = aggregated.get(row.product_id) || { sold: 0, reserved: 0 }
          current.sold += row.quantity
          if (row.previous_status === 'reserved') current.reserved += row.quantity
          aggregated.set(row.product_id, current)
        }
        const productIds = Array.from(aggregated.keys())
        const soldQuantities = productIds.map((id) => aggregated.get(id).sold)
        const reservedQuantities = productIds.map((id) => aggregated.get(id).reserved)
        await client.query(
          `UPDATE inventory AS i
           SET sold = i.sold + r.sold_quantity,
               reserved = GREATEST(i.reserved - r.reserved_quantity, 0),
               updated_at = NOW()
           FROM (
             SELECT product_id, sold_quantity, reserved_quantity
             FROM UNNEST($1::text[], $2::int[], $3::int[]) AS t(product_id, sold_quantity, reserved_quantity)
           ) AS r
           WHERE i.product_id = r.product_id`,
          [productIds, soldQuantities, reservedQuantities]
        )
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}

export async function releaseReservations(ids) {
  const reservationIds = normalizeReservationIds(ids)
  if (!reservationIds.length) return

  await withClient(async (client) => {
    await client.query('BEGIN')
    try {
      const { rows } = await client.query(
        `UPDATE reservations
         SET status = 'expired'
         WHERE id = ANY($1) AND status = 'reserved'
         RETURNING product_id, quantity`,
        [reservationIds]
      )
      await adjustInventory(client, rows)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}
