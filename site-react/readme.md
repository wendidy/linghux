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

TODO: Currently webhook is pointing to https://linghux-u7a0p5aju-linghuxiaolhx-4206s-projects.vercel.app/api/stripe-webhook, need to change it to the real website once the domain is set up with vercel
---

## DB
Neon is storing limited-edition inventory state and completed Stripe orders in this codebase.

Specifically, `api/db.js` creates these tables:

For every selectable size, create an active Stripe product whose product name exactly matches the SKU, for example:

universityOfDenver:limited-edition-prints:5x7

Then set:

Stripe product default price = that size’s price
For limited editions only: Stripe product metadata edition_cap=100 or whatever the cap is
Neon inventory will use:

product_id: Stripe product ID
sku: readable size SKU
cap
sold
reserved
The inventory row is created/updated when checkout reserves stock. You can also pre-seed rows manually if you want inventory visible in Neon before the first checkout.

id
product_id
quantity
status
created_at

orders

id
payment_intent_id
customer_email
customer_name
customer_phone
shipping_name
shipping_phone
shipping_address
billing_address
currency
amount_subtotal
amount_total
payment_status
notified_at
notification_error
created_at
updated_at

order_items

id
order_id
price_id
product_id
title
quantity
unit_amount
amount_subtotal
amount_total
currency
product_metadata
created_at

## Order Notifications

Completed orders are handled by `/api/stripe-webhook`.

Flow:

1. Stripe Checkout completes payment.
2. Vercel receives the `checkout.session.completed` webhook.
3. The webhook finalizes reserved inventory.
4. The webhook stores the order and its line items in Neon.
5. The webhook emails the order details to you through Resend.

Required Vercel environment variables for notifications:

* `RESEND_API_KEY`
* `ORDER_NOTIFICATION_EMAIL_TO`
* `ORDER_NOTIFICATION_EMAIL_FROM`

Suggested values:

* `ORDER_NOTIFICATION_EMAIL_TO=you@your-inbox.com` or your preferred inbox
* `ORDER_NOTIFICATION_EMAIL_FROM=orders@linghux.com`

The order email includes:

* customer name
* customer email
* customer phone
* shipping address
* billing address
* items ordered
* paid total

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

Testing with live stripe key:

Careful way: pull production env into a separate local file, then run Vercel dev with it only when you need to check live Stripe data.

From site-react:

cd site-react
vercel link
vercel env pull .env.production.local --environment=production
Then inspect that .env.production.local has STRIPE_SECRET_KEY. Do not commit it. It should be ignored because site-react/.gitignore ignores .env*.local.

To use it locally:

cp .env.local .env.local.backup
cp .env.production.local .env.local
vercel dev
Then test only the prices endpoint first:

curl -i -X POST http://localhost:3000/api/prices \
  -H 'Content-Type: application/json' \
  -d '{"itemIds":["signalHill:open-edition-prints:5x7"]}'
After testing, restore your normal dev env:

mv .env.local.backup .env.local
