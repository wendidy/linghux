# Security Hardening Checklist

This app already has in-code API guards in `api/security.js`. Use these Vercel Firewall settings as the edge/CDN layer in front of those guards.

## Vercel Firewall / WAF

Open: Vercel Dashboard -> this project -> Firewall -> Configure.

### Managed Rulesets

Enable these first in `Log` mode for 24-48 hours, then move to blocking actions after checking Firewall Observability.

| Ruleset | Mode | Notes |
| --- | --- | --- |
| Bot Protection Managed Ruleset | Challenge | Challenges non-browser traffic while allowing verified bots. |
| AI Bots Managed Ruleset | Deny or Log | Use `Deny` if you do not want AI crawlers training/fetching the site; use `Log` if you want visibility first. |
| OWASP Core Ruleset | Log, then Deny | Enterprise-only. Start with Log, then deny high-confidence SQLi/XSS/RCE/path traversal rules. |

Do not put Cloudflare or another reverse proxy in front of Vercel if you want Vercel Bot Protection to be accurate. Vercel warns that reverse proxies can degrade bot detection.

### Custom Rules

Create these in order, top to bottom.

1. `Deny non-POST API method abuse`
   - Conditions:
     - Request Path starts with `/api/`
     - Method is any of `GET`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
     - Request Path does not equal `/api/stripe-webhook` if Stripe sends any unusual method probes you want to observe first
   - Action: `Deny`

2. `Challenge suspicious API clients`
   - Conditions:
     - Request Path starts with `/api/`
     - User Agent contains `curl`
   - Add OR conditions for:
     - User Agent contains `python-requests`
     - User Agent contains `httpclient`
     - User Agent contains `scrapy`
     - User Agent equals empty string, if Vercel lets you match empty values
   - Action: `Challenge`

3. `Deny obvious exploit probes`
   - Conditions:
     - Request Path matches expression:
       ```
       (?i)(wp-admin|wp-login|xmlrpc\.php|phpmyadmin|\.env|\.git|cgi-bin|vendor/phpunit|actuator|jmx-console)
       ```
   - Action: `Deny`

4. `Deny path traversal probes`
   - Conditions:
     - Request Path matches expression:
       ```
       (?i)(\.\./|%2e%2e|%252e%252e|etc/passwd|windows/win\.ini)
       ```
   - Action: `Deny`

5. `Challenge repeated checkout abuse`
   - Conditions:
     - Request Path equals `/api/checkout`
     - Method equals `POST`
   - Action: `Rate Limit`
   - Strategy: `Fixed Window`
   - Window: `60s`
   - Limit: `10`
   - Counting key: `IP` and `JA4 Digest`
   - Exceeded action: `Challenge`

6. `Rate limit catalog API`
   - Conditions:
     - Request Path is any of `/api/prices`, `/api/availability`
     - Method equals `POST`
   - Action: `Rate Limit`
   - Strategy: `Fixed Window`
   - Window: `60s`
   - Limit: `120`
   - Counting key: `IP` and `JA4 Digest`
   - Exceeded action: `429`

7. `Rate limit checkout cancellation`
   - Conditions:
     - Request Path equals `/api/checkout-cancel`
     - Method equals `POST`
   - Action: `Rate Limit`
   - Strategy: `Fixed Window`
   - Window: `60s`
   - Limit: `20`
   - Counting key: `IP` and `JA4 Digest`
   - Exceeded action: `429`

8. `Protect Stripe webhook from public abuse`
   - Conditions:
     - Request Path equals `/api/stripe-webhook`
     - Method equals `POST`
   - Action: `Rate Limit`
   - Strategy: `Fixed Window`
   - Window: `60s`
   - Limit: `120`
   - Counting key: `IP` and `JA4 Digest`
   - Exceeded action: `429`
   - Keep the in-code Stripe signature verification; do not challenge this endpoint because Stripe cannot solve browser challenges.

## CDN-Level Rate Limiting

Use Vercel WAF Rate Limiting as the CDN/edge rate-limit layer. Start with these thresholds:

| Path | Limit | Window | Exceeded Action |
| --- | ---: | ---: | --- |
| `/api/checkout` | 10 | 60s | Challenge |
| `/api/checkout-cancel` | 20 | 60s | 429 |
| `/api/prices` | 120 | 60s | 429 |
| `/api/availability` | 120 | 60s | 429 |
| `/api/stripe-webhook` | 120 | 60s | 429 |

If legitimate users are blocked, raise limits by 2x before weakening validation. If attacks continue, lower checkout to 5/minute and keep catalog endpoints at 60/minute.

## Bot Protection

Recommended setup:

1. Enable `Bot Protection Managed Ruleset` in `Log` mode first.
2. After 24-48 hours, switch to `Challenge`.
3. Enable `AI Bots Managed Ruleset`.
   - Use `Deny` if you do not want AI crawlers.
   - Use `Log` if you want to confirm traffic first.
4. Add bypass rules only for trusted services you personally use, such as uptime monitors, and scope them tightly by IP or known header.

Do not challenge `/api/stripe-webhook`; Stripe webhooks are signed server-to-server requests and should be validated by the webhook signature code.

## During an Active Attack

1. Vercel Dashboard -> Firewall -> enable Attack Challenge Mode.
2. Lower `/api/checkout` rate limit to `5` per `60s`.
3. Add temporary IP Blocking for the worst IPs or ASNs shown in Firewall Observability.
4. Keep Stripe webhook on signature validation plus rate limiting only.
5. After the attack, remove broad temporary blocks so normal customers and search crawlers can reach the site.

## References

- Vercel Firewall: https://vercel.com/docs/vercel-firewall
- WAF custom rules: https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules
- WAF rate limiting: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- WAF managed rulesets: https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets
- Bot Management: https://vercel.com/docs/bot-management
