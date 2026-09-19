import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../db.js', () => ({
  withClient: vi.fn(),
}))

import handler from '../mail-club-waitlist.js'
import { withClient } from '../db.js'

describe('Mail Club waitlist API handler', () => {
  let req
  let res
  let query

  beforeEach(() => {
    vi.clearAllMocks()
    query = vi.fn()
    withClient.mockImplementation(async (callback) => callback({ query }))
    req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {},
    }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn(),
    }
  })

  it('rejects an invalid email', async () => {
    req.body = { email: 'not-an-email' }

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Please enter a valid email address.' })
  })

  it('normalizes and stores a valid email in Neon', async () => {
    query.mockResolvedValue({ rowCount: 1, rows: [{ id: 1 }] })
    req.body = { email: '  Artist@Example.COM ' }

    await handler(req, res)

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO mail_club_waitlist'), ['artist@example.com'])
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are on the Mail Club waitlist.' })
  })

  it('treats a repeated email as a successful no-op', async () => {
    query.mockResolvedValue({ rowCount: 0, rows: [] })
    req.body = { email: 'repeat@example.com' }

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are on the Mail Club waitlist.' })
  })
})
