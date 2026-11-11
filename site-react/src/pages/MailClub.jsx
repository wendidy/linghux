import Seo from '../components/Seo'
import { buildBreadcrumbJsonLd, SITE_NAME, SITE_URL } from '../utils/seo'

export default function MailClub() {
  const pageTitle = `Mail Club | ${SITE_NAME}`
  const pageDescription = 'Receive a monthly letter, postcard, handmade bookmark, and occasional surprises from Wendy Zhang’s studio through the linghux Mail Club.'
  const pageUrl = `${SITE_URL}/mail-club`
  const jsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Mail Club', url: '/mail-club' },
  ])

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
            src="/images/mailclub.jpg"
            alt="A quiet studio moment from Wendy Zhang"
          />
          <div className="mail-club-hero-overlay">
            <p className="mail-club-eyebrow">A piece of tranquility in your mailbox</p>
            <h1>Mail Club</h1>
            <div className="mail-club-signup">
              <p className="mail-club-signup-instructions">
                Choose the subscription for your shipping destination:
              </p>
              <div className="mail-club-signup-options">
                <a
                  className="button mail-club-signup-button"
                  href="https://buy.stripe.com/5kQ6oAe3V5iP6lnfaR57W01"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>US &amp; Canada - 9USD</strong>
                </a>
                <a
                  className="button mail-club-signup-button"
                  href="https://buy.stripe.com/4gM7sE0d512z9xz8Mt57W00"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>International - 11USD</strong>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mail-club-content">
          <header>
            <h2>A quieter road walked together</h2>
          </header>
          <p>
            Maybe you’re craving a slower rhythm. A little time each month that isn’t about chasing, producing, or keeping up, just you, a brush, and making a painting.          
          </p>
          <p>
            The Mail Club is for you. Each month, an envelope arrives at your door, put together by hand, to help you come back to that calm.
          </p>
          <p>Each month, your envelope holds:</p>
          <ul>
            <li>A <b>4 × 6 postcard</b> of one of my paintings, something to set on your desk or tuck by a window, a small reminder to pause</li>
            <li>A <b>full step-by-step tutorial</b>, so you can sit down and paint the same piece at your own pace. No pressure to get it “right”; the point is the quiet hour you give yourself</li>
            <li>A <b>personal letter</b> about the painting's inspiration and my art journey</li>
          </ul>
          <p><b>
            Every month, one friend in the club receives an extra surprise in their envelope. It’s a one-of-one piece, made for one person, and it will never be sent to anyone else.
          </b>
          </p>
          <p>Come walk with me.</p>
          <p>
            Choose the subscription option for your shipping destination above to join the Mail Club.
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
            Join by the 25th of the month to receive the current month’s mailer. If you join after the 25th, you will subscribe to the next month’s mailer.
          </p>
          <p>
            Your subscription is billed on the same day each month that you initially subscribed.
          </p>
          <p>
            You can change your shipping address or cancel your subscription at any time through the <a href="https://billing.stripe.com/p/login/4gM7sE0d512z9xz8Mt57W00" target="_blank" rel="noopener noreferrer">Stripe's Customer Portal</a>. The current month's subscription is non-refundable once the payment has been charged.
          </p>
          <p>
            If your mail arrives damaged or contains the wrong items, please email Wendy at <a href="mailto:linghuxiaolhx@gmail.com">linghuxiaolhx@gmail.com</a> with your name and photos of the item(s).
          </p>
        </div>
      </section>
    </>
  )
}
