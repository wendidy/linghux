import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { ARTWORK_CATEGORIES } from '../utils/artwork'
import {
  ARTIST_NAME,
  ARTIST_SCHEMA_ID,
  buildBreadcrumbJsonLd,
  ORGANIZATION_SCHEMA_ID,
  SITE_NAME,
  SITE_URL,
  WEBSITE_SCHEMA_ID,
} from '../utils/seo'

const shopPanels = [
  {
    title: 'Limited Edition Watercolor Prints',
    image: '/images/signalHill/signalHill.jpg',
    alt: `Limited edition watercolor print by ${ARTIST_NAME}`,
    button: 'Shop Limited Edition Prints',
    to: `/artwork/${ARTWORK_CATEGORIES.limitedEditionPrints}`,
  },
  {
    title: 'Open Edition Watercolor Prints',
    image: '/images/peleeIsland/peleeIsland.jpg',
    alt: `Open edition watercolor print by ${ARTIST_NAME}`,
    button: 'Shop Open Edition Prints',
    to: `/artwork/${ARTWORK_CATEGORIES.openEditionPrints}`,
  },
  {
    title: 'Original Watercolor Paintings',
    image: '/images/goreCreek/goreCreek.png',
    alt: `Original watercolor painting by ${ARTIST_NAME}`,
    button: 'Shop Originals',
    to: `/artwork/${ARTWORK_CATEGORIES.originals}`,
  },
]

export default function Home(){
  const pageTitle = `${SITE_NAME} watercolor art by ${ARTIST_NAME} | Originals and prints`
  const pageDescription = `Shop original watercolors and archival prints by ${ARTIST_NAME}, the Canadian artist behind ${SITE_NAME}, with plein air landscapes from Newfoundland, Colorado, and beyond.`
  const pageUrl = `${SITE_URL}/`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      name: pageTitle,
      description: pageDescription,
      url: pageUrl,
      isPartOf: { '@id': WEBSITE_SCHEMA_ID },
      about: { '@id': ARTIST_SCHEMA_ID },
      mainEntity: { '@id': ORGANIZATION_SCHEMA_ID },
    },
    buildBreadcrumbJsonLd([{ name: 'Home', url: '/' }]),
  ]

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
        title={pageTitle}
        description={pageDescription}
        url={pageUrl}
        keywords="linghux art, Wendy Zhang artist, shop original watercolor paintings, limited edition watercolor prints, open edition watercolor prints, Canadian watercolor artist"
        jsonLd={jsonLd}
      />
      <section id="home" className="main style1 dark fullscreen">
        <div className="content" aria-hidden="true" />
      </section>

      <section className="home-intro-section">
        <div className="home-intro-copy">
          <h1>linghux watercolor art by Wendy Zhang</h1>
          <p>"I wander for landscapes and linger for people, collecting their stories in watercolor.</p>
          <p>Tell me, where did the world speak to you most dearly?"</p>
          <p>
            Wendy paints original plein air watercolors and archival prints shaped by travel, attention, and the quiet exchanges that make a place memorable. Explore originals, limited editions, and open edition prints from Newfoundland, Colorado, Ontario, France, England, and the western coast.
          </p>
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
