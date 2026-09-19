import { withClient } from './db.js'
import { withApiSecurity } from './security.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function mailClubWaitlistHandler(req, res) {
  const rawEmail = req.body?.email
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' })
    return
  }

  try {
    const result = await withClient((client) => client.query(
      `INSERT INTO mail_club_waitlist (email)
       VALUES ($1)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [email]
    ))

    res.status(result.rowCount > 0 ? 201 : 200).json({
      message: 'You are on the Mail Club waitlist.',
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to join the Mail Club waitlist.' })
  }
}

export default withApiSecurity(mailClubWaitlistHandler, {
  rateLimit: { key: 'mail-club-waitlist', max: 10 },
})