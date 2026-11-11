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

  function handleSubmit(e) {
    e.preventDefault()
    const form = e.target
    if (window.emailjs && window.emailjs.sendForm) {
      window.emailjs.sendForm('service_1bbz9d9', 'template_584scza', form)
        .then(() => alert('Message sent successfully!'))
        .catch((err) => alert('Failed to send message:\n' + JSON.stringify(err)))
    } else {
      alert('Email service is not loaded. Please try again later.')
    }
    form.reset()
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
