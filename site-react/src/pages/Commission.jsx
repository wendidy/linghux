import ContactFormPage from '../components/ContactFormPage'
import { ARTIST_NAME, buildBreadcrumbJsonLd, SITE_NAME, SITE_URL } from '../utils/seo'

export default function Commission() {
  const pageTitle = `Commission a Watercolor Painting | ${SITE_NAME} by ${ARTIST_NAME}`
  const pageDescription = `Commission a one-of-a-kind watercolor painting from ${ARTIST_NAME}. Share the place, memory, or idea you would like to bring to life.`
  const pageUrl = `${SITE_URL}/commission`
  const jsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Commission a Painting', url: '/commission' },
  ])

  return (
    <ContactFormPage
      title={pageTitle}
      description={pageDescription}
      url={pageUrl}
      keywords="watercolor painting commission, custom watercolor painting, Wendy Zhang commission"
      jsonLd={jsonLd}
      heading="Commission a Painting"
      intro="Have a place, memory, or idea you would love to see in watercolor? Tell me a little about it below (size, where do you want it shipped), and I’ll be in touch to discuss your commission."
    />
  )
}
