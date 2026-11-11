import ContactFormPage from '../components/ContactFormPage'
import { ARTIST_NAME, buildBreadcrumbJsonLd, SITE_NAME, SITE_URL } from '../utils/seo'

export default function Contact() {
  const pageTitle = `Contact ${ARTIST_NAME} | ${SITE_NAME} watercolor art`
  const pageDescription = `Contact ${ARTIST_NAME}, the artist behind ${SITE_NAME}, about original watercolor paintings, prints, commissions, and collector questions.`
  const pageUrl = `${SITE_URL}/contact`
  const jsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: `Contact ${ARTIST_NAME}`, url: '/contact' },
  ])

  return (
    <ContactFormPage
      title={pageTitle}
      description={pageDescription}
      url={pageUrl}
      keywords="contact Wendy Zhang, contact linghux, watercolor artist contact, original watercolor paintings"
      jsonLd={jsonLd}
      heading="Connect With Me"
    />
  )
}
