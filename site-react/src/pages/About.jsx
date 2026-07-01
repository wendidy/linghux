import Seo from '../components/Seo'
import { buildArtistPageJsonLd, buildBreadcrumbJsonLd, SITE_URL } from '../utils/seo'

export default function About(){
  const pageTitle = 'Wendy Zhang | About the linghux watercolor artist'
  const pageDescription = 'Learn about Wendy Zhang, the Canadian watercolor artist behind linghux, creating original plein air paintings and archival prints rooted in Newfoundland and Colorado landscapes.'
  const pageUrl = `${SITE_URL}/about`
  const jsonLd = [
    buildArtistPageJsonLd(),
    buildBreadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'About Wendy Zhang', url: '/about' },
    ]),
  ]

  return (
    <>
      <Seo
        title={pageTitle}
        description={pageDescription}
        url={pageUrl}
        keywords="Wendy Zhang artist, linghux, Canadian watercolor artist, plein air painter, Newfoundland watercolor artist, Colorado landscape paintings"
        jsonLd={jsonLd}
      />
      <section>
        <div className="content box style2">
          <div className="about-grid">
            <div className="about-photo">
              <img loading="lazy" src="/images/wendy-about.jpg" alt="Wendy Zhang painting" />
            </div>
            <div className="about-text">
              <header>
                <h1>About Wendy Zhang</h1>
              </header>
              <p>Wendy Zhang is the Canadian watercolor artist behind linghux. Her work is shaped by a life lived across three countries and varied landscapes — and by the practice of painting directly in them.</p>
              <p>Working plein air, Wendy sets up wherever she finds herself: beside mountain trails, in coastal light, along quiet city edges. Painting on location is not a method so much as a commitment — to being fully present in a place, to recording what the eye catches and the hand follows before the moment passes.</p>
              <p>Her paintings carry what travel revealed to be essential: the invisible connections that bind us to one another, and to the living world we move through. Moving between cultures taught her that what endures beyond language, geography, or circumstance is a single, unbroken thread — woven between people and the earth that holds them. In unfamiliar places, she found herself drawn to the quiet exchanges and shared moments that give a place its meaning, and to the way the natural world carries its own kind of memory.</p>
              {/* <p>Each painting begins as a direct encounter — brush to paper, in the open air — and becomes a bridge: between artist and viewer, between memory and presence, between a moment once lived and a moment newly felt.</p> */}
              {/* <p>Wendy Zhang is the Canadian watercolor artist behind linghux. Her work is shaped by a life lived across three countries and varied landscapes. Moving between cultures taught her that what endures beyond language, geography, or circumstance is a single, unbroken thread — woven between people, and the earth that holds them.  In unfamiliar places, she found herself drawn to the quiet exchanges and shared moments that give a place its meaning, and to the way the natural world carries its own kind of memory.</p> */}
              {/* <p>Watercolor became her way of honoring those encounters. Using both her camera and her brushes, Wendy translates fleeting experiences into gentle, lasting forms—allowing each painting to serve as a bridge: between artist and viewer, between memory and presence, between a moment once lived and a moment newly felt. Through this process, she seeks to preserve what travel revealed to be essential: the invisible connection that bind us to one another, and to the living world we move through.</p> */}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="content box style2">
          <div className="about-grid reverse">
            <div className="about-text">
              <header>
                <h2>Shows</h2>
              </header>
              <ul>
                <li><strong>Avon Arts Celebration 2025</strong>, <em>July 2025</em>, Avon, Colorado</li>
                <li><strong>Silverthorne Fine Art Festival 2025</strong>, <em>July 2025</em>, Silverthorne, Colorado</li>
                <li><strong>Highlands Art Festival 2025</strong>, <em>June 2025</em>, Denver, Colorado</li>
              </ul>
            </div>
            <div className="about-photo">
              <img loading="lazy" src="/images/background2.png" alt="Wendy Zhang studio" />
            </div>
          </div>
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
