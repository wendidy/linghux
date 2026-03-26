# Linghux Website Setup

## Domain

* Domain: `linghux.com` (Namecheap)
---

## Frontend

* Framework: React + Vite
* Hosting: Vercel
* Auto deploy on `git push`
* pointing at ./site-react

---

## Backend

Main site hosted on **Vercel**. Secrets and env vars are stored on vercel.
If new env vars are introduced, do **vercel link** under linghux-blog

___

## 💳 Payments

* Provider: Stripe
* Flow:

  ```
  React frontend → /api/checkout → Stripe Checkout → payment
  ```
* Secret key stored in:

  ```
  Vercel → Environment Variables → STRIPE_SECRET_KEY
  ```

---

## DB
Neon is only storing limited-edition inventory state in this codebase.

Specifically, db.js (line 18) creates two tables:

inventory

product_id
cap
sold
reserved
updated_at
reservations

id
product_id
quantity
status
created_at

## 📬 Newsletter (Beehiiv)

* Platform: Beehiiv
* Publication: Linghux

### Domains

* Newsletter site: `letters.linghux.com`
* Sending email: `wendy@linghux.com`

### DNS (Namecheap)

* CNAME:

  ```
  letters → cname.beehiiv.com
  ```
* TXT (verification + email):

  ```
  _beehiiv-authentication-xxxxx
  SPF (merged):
  v=spf1 include:spf.efwd.registrar-servers.com include:spf.beehiiv.com ~all
  ```
* DKIM:

  ```
  beehiiv._domainkey → (provided by Beehiiv)
  ```

## 📧 Email Setup

* Sending: Beehiiv (`wendy@linghux.com`)
* Replies: routed to personal inbox (Gmail)
* Important:

  * SPF + DKIM configured to avoid spam

---


## 🔄 Future Improvements

* Replace iframe with custom form (Beehiiv API)
* Add USD payout optimization (Wise)
* Improve newsletter section design

---

## Core Newsletter Template (your signature style)
Subject:
A place I keep coming back to

---

Hi, it’s Wendy,

Lately I’ve been thinking about how certain places stay with us—not because they were grand, but because of how they made us feel.

[Write 2–4 sentences about a moment]
– where you were  
– what you noticed  
– a small detail (light, air, sound, a person)

---

I painted this piece after that moment.

[Insert image of your artwork]

It wasn’t about capturing the exact scene, but about holding onto that feeling—the quiet, the stillness, the sense that time had slowed down, even if just for a little while.

---

Sometimes I think the most meaningful parts of traveling aren’t the places themselves, but the brief connections we make along the way.

A conversation. A glance. A shared silence.

---

If this piece resonates with you, you can see it here:
[link to your website]

---

Thank you for being here.

Wendy