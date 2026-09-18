import { useState } from 'react'
import Seo from '../components/Seo'
import { buildBreadcrumbJsonLd, SITE_NAME, SITE_URL } from '../utils/seo'

export default function MailClub() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pageTitle = `Mail Club | ${SITE_NAME}`
  const pageDescription = 'Join the linghux Mail Club for handwritten notes, studio glimpses, and first access to new watercolor work from Wendy Zhang.'
  const pageUrl = `${SITE_URL}/mail-club`
  const jsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Mail Club', url: '/mail-club' },
  ])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/mail-club-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to join the waitlist. Please try again.')
      }

      setEmail('')
      setStatus({ type: 'success', message: payload.message })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Seo
        title={pageTitle}
        description={pageDescription}
        url={pageUrl}
        image="/images/about1.jpg"
        keywords="linghux Mail Club, Wendy Zhang artist newsletter, watercolor art community, artist mail club"
        jsonLd={jsonLd}
      />
      <section className="mail-club-page">
        <div className="mail-club-hero">
          <img
            src="/images/about1.jpg"
            alt="A quiet studio moment from Wendy Zhang"
          />
          <div className="mail-club-hero-overlay">
            <p className="mail-club-eyebrow">A little art in your mailbox</p>
            <h1>Mail Club</h1>
            <form className="mail-club-waitlist-form" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="mail-club-email">Email address</label>
              <input
                id="mail-club-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email address"
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
              <button className="button mail-club-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Joining...' : 'Join the waitlist'}
              </button>
            </form>
            {status.message && (
              <p className={`mail-club-form-status is-${status.type}`} role="status">
                {status.message}
              </p>
            )}
          </div>
        </div>

        <div className="mail-club-content">
          <header>
            <h2>A slower way to stay connected</h2>
          </header>
          <p>
            The Mail Club is a small, thoughtful dispatch from my studio: a chance to receive something tangible, personal, and made with care.
          </p>
          <p>
            Members will get occasional letters, small artful surprises, behind-the-scenes notes, and first looks at new paintings and print releases before they are shared more widely.
          </p>
          <p>
            I am preparing the first mailing now. Join the waitlist and I will send you an invitation when the club opens next month.
          </p>
        </div>
      </section>
    </>
  )
}
