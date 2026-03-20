export default function Home(){
  return (
    <>
      <section id="home" className="main style1 dark fullscreen">
        <div className="content">
          <header>
            <p>I wander for landscapes and linger for people, collecting their stories in watercolor.</p>
            <p>Tell me, where did the world speak to you most clearly?</p>
          </header>
        </div>
      </section>

      <section className="newsletter">
        <div id="mc_embed_shell">
          <link href="//cdn-images.mailchimp.com/embedcode/classic-061523.css" rel="stylesheet" type="text/css" />
          <div id="mc_embed_signup" className="content">
            <header id="mc_embed_signup_scroll">
              <h3>Join my collectors list to receive early access to new paintings and limited edition releases</h3>
            </header>
            <div className="box">
              <form action="https://linghux.us5.list-manage.com/subscribe/post?u=3dcbb24c74c83b0c00845905d&amp;id=ef71d4947b&amp;f_id=009c21ebf0" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" className="validate" target="_blank">
                <div className="fields">
                  <div className="field">
                    <label htmlFor="mce-EMAIL">Email Address <span className="asterisk">*</span></label>
                    <input type="email" name="EMAIL" className="required email" id="mce-EMAIL" required defaultValue="" />
                  </div>
                  <div className="field">
                    <label htmlFor="mce-FNAME">First Name </label>
                    <input type="text" name="FNAME" className="text" id="mce-FNAME" defaultValue="" />
                  </div>
                  <div className="field">
                    <label htmlFor="mce-LNAME">Last Name </label>
                    <input type="text" name="LNAME" className="text" id="mce-LNAME" defaultValue="" />
                  </div>
                </div>
                <div id="mce-responses" className="clear foot">
                  <div className="response" id="mce-error-response" style={{display: 'none'}}></div>
                  <div className="response" id="mce-success-response" style={{display: 'none'}}></div>
                </div>
                <div style={{position: 'absolute', left: '-5000px'}} aria-hidden="true">
                  <input type="text" name="b_3dcbb24c74c83b0c00845905d_ef71d4947b" tabIndex={-1} defaultValue="" />
                </div>
                <ul className="actions special">
                  <input type="submit" name="subscribe" id="mc-embedded-subscribe" className="button" value="Subscribe" />
                </ul>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
