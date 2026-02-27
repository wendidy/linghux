import React, { useEffect } from 'react'

export default function Contact(){
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
    <section id="contact" className="main style3 secondary">
      <div className="content">
        <header>
          <h2>Connect With Me</h2>
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
  )
}
