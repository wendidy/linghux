import { useEffect } from 'react'

export default function Home(){
  useEffect(() => {
    const existing = document.querySelector('script[data-beehiiv-embed]')
    if (existing) {
      return undefined
    }

    const script = document.createElement('script')
    script.src = 'https://subscribe-forms.beehiiv.com/embed.js'
    script.async = true
    script.dataset.beehiivEmbed = 'true'
    document.body.appendChild(script)

    return () => {
      script.remove()
    }
  }, [])

  return (
    <>
      <section id="home" className="main style1 dark fullscreen">
        <div className="content">
          <header>
            <p>I wander for landscapes and linger for people, collecting their stories in watercolor.</p>
            <p>Tell me, where did the world speak to you most dearly?</p>
          </header>
        </div>
      </section>

      <section className="newsletter-section">
        <div className="newsletter-wrap">
          <h2 className="newsletter-title">
            Join my collectors list for first access to new paintings and limited releases
          </h2>
          <div className="newsletter-frame-shell">
            <iframe
              src="https://subscribe-forms.beehiiv.com/7a8eb526-6862-430e-b8d2-51301982db42"
              className="beehiiv-embed newsletter-frame"
              data-test-id="beehiiv-embed"
              scrolling="no"
              loading="lazy"
              title="Subscribe to my newsletter"
            />
          </div>
        </div>
      </section>
    </>
  )
}
