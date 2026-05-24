export default function About(){
  return (
    <>
      <section id="one" className="main style2 left about-section">
        <div className="content box style2">
          <header>
            <h2>About</h2>
          </header>
          <p>Wendy Zhang’s work is shaped by a life lived across three countries and varied landscapes. Moving between cultures taught her that what endures beyond language, geography, or circumstance is a single, unbroken thread — woven between people, and between people and the earth that holds them.  In unfamiliar places, she found herself drawn to the quiet exchanges and shared moments that give a place its meaning, and to the way the natural world carries its own kind of memory.  </p>
<p>Watercolor became her way of honoring those encounters. Using both her camera and her brushes, Wendy translates fleeting experiences into gentle, lasting forms—allowing each painting to serve as a bridge: between artist and viewer, between memory and presence, between a moment once lived and a moment newly felt. Through this process, she seeks to preserve what travel revealed to be essential: the invisible connection that bind us to one another, and to the living world we move through. </p>
        </div>
      </section>

      <section id="two" className="main style2 right about-section">
        <div className="content box style2">
          <header>
            <h2>Shows</h2>
          </header>
          <ul>
            <li><strong>Avon Arts Celebration 2025</strong>, <em>July 2025</em>, Avon, Colorado</li>
            <li><strong>Silverthorne Fine Art Festival 2025</strong>, <em>July 2025</em>, Silverthorne, Colorado</li>
            <li><strong>Highlands Art Festival 2025</strong>, <em>June 2025</em>, Denver, Colorado</li>
          </ul>
          <p></p>
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
