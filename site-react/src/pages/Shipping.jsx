import Seo from '../components/Seo'
import { buildBreadcrumbJsonLd, SITE_URL } from '../utils/seo'

export default function Shipping() {
  const pageTitle = 'Shipping and delivery | linghux watercolor art'
  const pageDescription = 'Shipping details for linghux original watercolor paintings and prints by Wendy Zhang, including tracked delivery in Canada and the United States.'
  const pageUrl = `${SITE_URL}/shipping`
  const jsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Shipping and delivery', url: '/shipping' },
  ])

  return (
    <>
      <Seo
        title={pageTitle}
        description={pageDescription}
        url={pageUrl}
        keywords="linghux shipping, watercolor art shipping, Wendy Zhang art shipping, Canada art shipping, United States art shipping"
        jsonLd={jsonLd}
      />
      <section id="shipping" className="main style2 about-section">
        <div className="box style2">
          <header>
            <h2>Shipping & Delivery</h2>
          </header>
          <h3>Shipping</h3>
          <p>Flat-rate tracked shipping is available for orders within Canada and the United States.</p>
          <p><b>For global collectors</b>, please connect directly with Wendy at <a href="mailto:linghuxiaolhx@gmail.com">linghuxiaolhx@gmail.com</a> to arrange the details and instructions will be provided.</p>
          <ul>
            <li>Canada — CAD $20</li>
            <li>United States — USD $25</li>
          </ul>

          <p>Complimentary shipping is available on qualifying orders:</p>
          <ul>
            <li>Canada — orders over CAD $300</li>
            <li>United States — orders over USD $250</li>
          </ul>
          <p>Shipping rates are automatically applied at checkout.</p>

          <p>Prints and original paintings are carefully packed using archival and protective materials, originals are shipped fully insured.</p>
          <p>Most orders are prepared and shipped within 3–7 business days.</p>

          <h3>Returns & Damaged Items</h3>
          <p>All sales are final, with no refunds or returns. If your item arrives damaged, please contact Wendy at <a href="mailto:linghuxiaolhx@gmail.com">linghuxiaolhx@gmail.com</a> and we will find a way to make it right.</p>
          
          <h3>Customs & Duties</h3>
          <p>International customers are responsible for any customs duties or import taxes charged by their country.</p>

          <h3>Delivery Times</h3>
          <p>Delivery times vary by destination and carrier. Tracking information will be provided once your order has shipped.</p>
        </div>
      </section>
    </>
  )
}
