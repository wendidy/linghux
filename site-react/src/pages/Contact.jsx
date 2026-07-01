import { useEffect } from 'react'
import Seo from '../components/Seo'
import { ARTIST_NAME, buildBreadcrumbJsonLd, buildContactPageJsonLd, SITE_NAME, SITE_URL } from '../utils/seo'

export default function Contact(){
  const pageTitle = `Contact ${ARTIST_NAME} | ${SITE_NAME} watercolor art`
  const pageDescription = `Contact ${ARTIST_NAME}, the artist behind ${SITE_NAME}, about original watercolor paintings, prints, commissions, and collector questions.`
  const pageUrl = `${SITE_URL}/contact`
  const jsonLd = [
    buildContactPageJsonLd({ title: pageTitle, description: pageDescription, url: pageUrl }),
    buildBreadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: `Contact ${ARTIST_NAME}`, url: '/contact' },
    ]),
  ]

  useEffect(() => {
    // dynamically load EmailJS SDK (same as original site)
    const s = document.createElement('script')
    s.src = 'https://cdn.emailjs.com/dist/email.min.js'
    s.async = true
    s.onload = () => {
      if (window.emailjs && window.emailjs.init) {
        window.emailjs.init('YTeXmNaw2azaNGfuH')
      }
    }
    document.body.appendChild(s)

    return () => {
      document.body.removeChild(s)
    }
  }, [])

  function handleSubmit(e){
    e.preventDefault()
    const form = e.target
    if (window.emailjs && window.emailjs.sendForm) {
      window.emailjs.sendForm('service_1bbz9d9', 'template_584scza', form)
      .then(() => alert('Message sent successfully!'))
      .catch(err => alert('Failed to send message:\n' + JSON.stringify(err)))
    } else {
      alert('Email service is not loaded. Please try again later.')
    }
    form.reset()
  }

  return (
    <>
      <Seo
        title={pageTitle}
        description={pageDescription}
        url={pageUrl}
        keywords="contact Wendy Zhang, contact linghux, watercolor artist contact, original watercolor paintings"
        jsonLd={jsonLd}
      />
      <section id="contact" className="main style3 secondary">
        <div className="content">
          <header>
            <h1>Contact Wendy Zhang About Watercolor Art</h1>
            <p>
              Use this form for questions about available originals, print sizing, collector orders, shipping, or commissions. Wendy reads each note personally and can help with artwork details, framing context, and choosing a piece that fits your space.
            </p>
            <p>
              For time-sensitive order questions, include the artwork title and your preferred shipping country so she can respond with the clearest next step.
            </p>
            <h2>Collector Questions and Studio Inquiries</h2>
          </header>
          <div className="box">
            <form id="contact-form" onSubmit={handleSubmit}>
              <div className="fields">
                <div className="field half"><input type="text" name="name" placeholder="Name" /></div>
                <div className="field half"><input type="email" name="email" placeholder="Email" /></div>
                <div className="field"><textarea name="message" placeholder="Message" rows="6"></textarea></div>
              </div>
              <ul className="actions special">
                <button type="submit">Send</button>
              </ul>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
