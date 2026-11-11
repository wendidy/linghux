import { useEffect } from 'react'
import Seo from './Seo'

export default function ContactFormPage({
  title,
  description,
  url,
  keywords,
  jsonLd,
  heading,
  intro,
}) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.emailjs.com/dist/email.min.js'
    script.async = true
    script.onload = () => {
      if (window.emailjs && window.emailjs.init) {
        window.emailjs.init('YTeXmNaw2azaNGfuH')
      }
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const timeField = form.elements.namedItem('time')
    if (timeField) timeField.value = new Date().toLocaleString()
    if (!window.emailjs || !window.emailjs.sendForm) {
      alert('Email service is not loaded. Please try again later.')
      return
    }

    try {
      await window.emailjs.sendForm('service_1bbz9d9', 'template_wdofuj1', form)
    } catch (err) {
      const details = err?.text || err?.message || JSON.stringify(err)
      const status = err?.status ? ` (${err.status})` : ''
      alert(`Failed to send message${status}:\n${details}`)
      return
    }

    await new Promise((resolve) => window.setTimeout(resolve, 1100))
    try {
      await window.emailjs.sendForm('service_1bbz9d9', 'template_584scza', form)
      alert('Your message was sent, and a confirmation email was sent to you.')
    } catch (err) {
      const details = err?.text || err?.message || JSON.stringify(err)
      alert(`Your message was sent, but the confirmation email failed:\n${details}`)
    } finally {
      form.reset()
    }
  }

  return (
    <>
      <Seo
        title={title}
        description={description}
        url={url}
        keywords={keywords}
        jsonLd={jsonLd}
      />
      <section id="contact" className="main style3 secondary">
        <div className="content">
          <header>
            <h2>{heading}</h2>
            {intro && <p>{intro}</p>}
          </header>
          <div className="box">
            <form id="contact-form" onSubmit={handleSubmit}>
              <input type="hidden" name="time" />
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
