import { useState } from 'react'
import Seo from '../components/Seo'
import { buildBreadcrumbJsonLd, SITE_NAME, SITE_URL } from '../utils/seo'

export default function MailClub() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pageTitle = `Mail Club | ${SITE_NAME}`
  const pageDescription = 'Receive a monthly letter, postcard, handmade bookmark, and occasional surprises from Wendy Zhang’s studio through the linghux Mail Club.'
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
            <p className="mail-club-eyebrow">A piece of tranquility in your mailbox</p>
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
            <h2>A small way to stay connected</h2>
          </header>
          <p>
            I started the Mail Club as a way to send a little piece of my creative journey to you. Each envelope is a personal note put together by hand.
          </p>
          <p>Each month, you will receive:</p>
          <ul>
            <li>A personal letter from me</li>
            <li>A 4 × 6 postcard featuring one of my paintings</li>
            <li>A bookmark</li>
          </ul>
          <p><b>
            Each month, I will also send one extra surprise postcard to one lucky friend on the list. You are the first one to see this work before anyone does.
          </b>
          </p>
          <p>
            I am preparing the first mailing now. Add your email to the waitlist and I will let you know when the club opens next month. 
          </p>
        </div>

        <div className="mail-club-content">
          <header>
            <h2>How the club works</h2>
          </header>
          <p>
            Mail is sent during the first week of each month using an untracked stamp. This helps keep the cost down and adds a little mystery to its arrival. We ship to every country from Canada🇨🇦. Please allow up to 21 business days for delivery.
          </p>
          <p>
            Join by the 20th of the month to receive the current month’s mailer. If you join after the 20th, you will subscribe to the next month’s mailer.
          </p>
          <p>
            Your subscription is billed on the same day each month that you initially subscribed.
          </p>
          <p>
            You can change your shipping address or cancel your subscription at any time through the Stripe's Customer Portal (link will be provided later). The current month's subscription is non-refundable once the payment has been charged.
          </p>
          <p>
            If your mail arrives damaged or contains the wrong items, please email Wendy at <a href="mailto:linghuxiaolhx@gmail.com">linghuxiaolhx@gmail.com</a> with your name and photos of the item(s).
          </p>
        </div>
      </section>
    </>
  )
}
