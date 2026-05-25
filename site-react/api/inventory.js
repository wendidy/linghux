import crypto from 'crypto'
import { withClient } from './db.js'

function normalizeReservationIds(ids) {
  const input = Array.isArray(ids) ? ids : []
  return [...new Set(input.filter(Boolean))]
}

export async function reserveInventory(requests) {
  const normalized = Array.isArray(requests) ? requests.filter(Boolean) : []
  if (normalized.length === 0) return []

  const reservations = []
  await withClient(async (client) => {
    await client.query('BEGIN')
    try {
      for (const request of normalized) {
        const cap = Number.parseInt(request.cap, 10)
        if (!Number.isInteger(cap) || cap <= 0) continue
        
        if (typeof request.quantity !== 'number') continue
        const quantity = Number.parseInt(request.quantity, 10)
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
          `INSERT INTO reservations (id, product_id, quantity, status)
           VALUES ($1, $2, $3, 'reserved')`,
          [reservationId, request.productId, quantity]
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
        `UPDATE reservations
         SET status = 'completed'
         WHERE id = ANY($1) AND status = 'reserved'
         RETURNING product_id, quantity`,
        [reservationIds]
      )
      if (rows.length > 0) {
        const aggregated = new Map()
        for (const row of rows) {
          aggregated.set(row.product_id, (aggregated.get(row.product_id) || 0) + row.quantity)
        }
        const productIds = Array.from(aggregated.keys())
        const quantities = productIds.map((id) => aggregated.get(id))
        await client.query(
          `UPDATE inventory AS i
           SET sold = i.sold + r.quantity,
               reserved = i.reserved - r.quantity,
               updated_at = NOW()
           FROM (SELECT product_id, quantity FROM UNNEST($1::text[], $2::int[]) AS t(product_id, quantity)) AS r
           WHERE i.product_id = r.product_id`,
          [productIds, quantities]
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
      if (rows.length > 0) {
        const aggregated = new Map()
        for (const row of rows) {
          aggregated.set(row.product_id, (aggregated.get(row.product_id) || 0) + row.quantity)
        }
        const productIds = Array.from(aggregated.keys())
        const quantities = productIds.map((id) => aggregated.get(id))
        await client.query(
          `UPDATE inventory AS i
           SET reserved = i.reserved - r.quantity,
               updated_at = NOW()
           FROM (SELECT product_id, quantity FROM UNNEST($1::text[], $2::int[]) AS t(product_id, quantity)) AS r
           WHERE i.product_id = r.product_id`,
          [productIds, quantities]
        )
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}
