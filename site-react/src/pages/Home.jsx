import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { ARTWORK_CATEGORIES } from '../utils/artwork'

const shopPanels = [
  {
    title: 'Limited Edition Prints',
    image: '/images/signalHill/signalHill.jpg',
    alt: 'Limited edition print',
    button: 'Go Shop Limited Edition Prints',
    to: `/artwork/${ARTWORK_CATEGORIES.limitedEditionPrints}`,
  },
  {
    title: 'Open Edition Prints',
    image: '/images/peleeIsland/peleeIsland.jpg',
    alt: 'Open edition print',
    button: 'Go Shop Open Edition Prints',
    to: `/artwork/${ARTWORK_CATEGORIES.openEditionPrints}`,
  },
  {
    title: 'Originals',
    image: '/images/goreCreek/goreCreek.png',
    alt: 'Original watercolor',
    button: 'Go Shop Originals',
    to: `/artwork/${ARTWORK_CATEGORIES.originals}`,
  },
]

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
      <Seo
        title="linghux | Original watercolor paintings and prints"
        description="Explore original plein air watercolor artwork, Newfoundland and Colorado landscape paintings, and collectible watercolor prints by linghux."
        keywords="shop originals, shop limited edition prints, shop open edition prints, about linghux, original watercolor paintings, watercolor prints"
      />
      <section id="home" className="main style1 dark fullscreen">
        <div className="content" aria-hidden="true" />
      </section>

      <section className="home-intro-section">
        <div className="home-intro-copy">
          <h1>Shop Originals, Limited Edition Prints, and Open Edition Prints</h1>
          <p>I wander for landscapes and linger for people, collecting their stories in watercolor.</p>
          <p>Tell me, where did the world speak to you most dearly?</p>
        </div>
      </section>

      <section className="shop-panels-section" aria-label="Shop artwork collections">
        <div className="shop-panels">
          {shopPanels.map((panel) => (
            <Link to={panel.to} className="shop-panel-link" key={panel.to}>
              <article className="shop-panel">
                <img loading="lazy" src={panel.image} alt={panel.alt} />
                <div className="shop-panel-body">
                  <h2>{panel.title}</h2>
                  <button className="button shop-panel-button" type="button">
                    {panel.button}
                  </button>
                </div>
              </article>
            </Link>
          ))}
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
