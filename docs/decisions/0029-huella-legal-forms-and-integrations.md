---
issue: 187
status: to-implement
decision: accepted
---

# 🧭 Huella Legal's forms and integrations

## Context

S3 in [the implementation plan](../plans/huella-legal-implementation.md) asks six questions before
E1 (newsletter) and E2 (publish submission) can start: the newsletter provider, where submissions
go, spam protection, GDPR copy and retention, what Contacto is, and whether validation takes a
library. The lean was server routes plus third-party providers. The old board assumed a contact
form; the form the design actually has is Publicar. S2 (#186) has no report yet, so every platform
limit below is Netlify's, the host today.

## Result

The live site was read unauthenticated on 29 Sep 2026, the same way as
[0027](./0027-huella-legal-content-model.md). Nothing recorded is committed.

**None of today's form wiring survives the cutover**, because all of it is WP plugin or embed config:

| Surface | Today | Spam wiring |
| --- | --- | --- |
| Newsletter | A Mailchimp audience fed from two places: an embedded Mailchimp form on the home page ("un correo al mes"), and Fluent Form 2 on `/suscripcion` (email and a terms checkbox), whose destination is set only in WP admin | Mailchimp's `b_` honeypot on the embed; Akismet's on the Fluent form |
| Publica tu artículo | Fluent Form 4: Nombre, Email, Mensaje and a terms checkbox. **No file.** The guide asks for the file after the first reading, and it prefers anonymous submissions for impartial review | reCAPTCHA v2 and Akismet's honeypot |
| Publica tu TFG/TFM | No form; the page sends readers to Contacto | — |
| Contacto | Fluent Form 1, the same fields as form 4 | reCAPTCHA v2 and Akismet's honeypot |
| Privacy text | A section of `aviso-legal`, the only legal page among the 21. It cites LOPD 15/1999, which LO 3/2018 repealed, and names MailChimp. It gives no legal basis, retention period or right to complain | — |

**The lean holds.** There are two Nitro routes, plus a third if Publicar keeps its form, and three
vendors, all called with `$fetch`, with no new dependency:

| Question | Answer |
| --- | --- |
| Newsletter provider | Mailchimp, into the same audience. `PUT /3.0/lists/{audience}/members/{md5 of the lowercased email}` with `status_if_new: "pending"`, which sends Mailchimp's confirmation email. The request carries no `status`, so an address that unsubscribed is never resubscribed. The route answers with the same success whether or not the address was already on the list |
| Where submissions go | **Pending: the owner decides when E2 starts.** The owner leans towards a `mailto:` to the editorial inbox, because accepting uploaded files is a safety risk they won't take on. The documented alternative is the form, sent as a Resend email with Reply-To set to the author and the file attached. In that variant the file stays optional and is capped at **4 MB**: Netlify's 6 MB buffered request is 4.5 MB of binary after base64. A larger file is refused with copy telling the author to send the proposal without it and reply with the file later, which is today's flow. The published PDFs in WP media serve as a proxy for manuscript size: of the 14 that report one, the median is 0.7 MB and one (11.8 MB) is over the cap. Rows marked *form only* apply only if E2 picks the form |
| Spam protection | A hidden honeypot field plus Cloudflare Turnstile in invisible mode, on both routes, verified server-side through `siteverify`. A filled honeypot gets the success response and nothing is sent. The widget script loads through Nuxt's `useScript` on the form's first `focusin`, so a page nobody signs up from never loads it |
| GDPR | Each form carries a first-layer notice: controller, purpose, legal basis, recipients, rights, and a link to the policy. The recipients are Netlify and Cloudflare on both forms, plus Mailchimp for the newsletter and Resend for Contacto (and Publicar, if it keeps its form). Resend acts as a processor under its DPA, and its US transfers are covered by the SCCs and the EU-U.S. Data Privacy Framework. The app stores nothing: a message exists only in the inbox and in Resend's log, which the Free plan keeps for 30 days |
| Contacto | A form at `/contacto`, with the live form's fields: Nombre, Email, Mensaje and consent. It is sent as a Resend email with Reply-To set to the sender, behind the honeypot and Turnstile checks. The route keeps its live path. WP page 625 can't supply it, because its body is Fluent Form 1, which posts to the WP host and which 0027's sanitiser strips. Its TFG job moves to Publicar |
| Validation library | Hand-rolled. There is one `validate` function per form in `shared/`, returning Nuxt UI's `FormError[]` (`{ name, message }`). It is passed to `UForm`'s `validate` prop and re-run by the route. The email rule is the HTML spec's valid e-mail address, the rule `type="email"` enforces |

Line numbers are as of this report. The `app/lab/` and `app/pages/lab/` anchors are where B4
promotes the markup from; the wiring goes into the promoted components, not into the lab:

| # | File | Change |
| --- | --- | --- |
| 1 | `apps/huella-legal/shared/forms/` (new) | `validateNewsletter`, `validateContact` and, *form only*, `validateSubmission`. Email is required in all three. For a submission: name, kind (Artículo, TFG or TFM) and summary required, title optional, file extension one of `.docx .doc .pages .rtf` and at most 4 MB, consent `true`. For contact: name, message and consent `true`. Messages are A2 keys |
| 2 | `apps/huella-legal/server/utils/mailchimp.ts` (new) | The adapter: the `PUT` above, with an MD5 from `node:crypto` |
| 3 | `apps/huella-legal/server/utils/resend.ts` (new) | The adapter: plain-text body, Reply-To and, *form only*, an optional base64 attachment |
| 4 | `apps/huella-legal/server/utils/turnstile.ts` (new) | The honeypot check, then `siteverify` with `secret`, `response`, and `remoteip` from `getRequestIP` |
| 5 | `apps/huella-legal/server/api/newsletter.post.ts` (new) | JSON body → 4 → 1 → 2. It answers 422 with the `FormError[]`, 403 on a failed challenge, 502 when the vendor fails, and 500 naming any unset variable |
| 6 | `apps/huella-legal/server/api/submissions.post.ts` (new, *form only*) | `readMultipartFormData` → 4 → 1 → 3, with the same status mapping |
| 6b | `apps/huella-legal/server/api/contact.post.ts` (new) | JSON body → 4 → 1 → 3 with no attachment, with the same status mapping |
| 7 | `apps/huella-legal/app/composables/useNewsletter.ts`, `useContact.ts`, and `useSubmission.ts` *form only* (new) | The lab's states as a machine: idle → submitting → success, invalid or error. A 422 becomes invalid, with the server's errors passed to `setErrors`; anything else becomes error |
| 8 | `apps/huella-legal/nuxt.config.ts:45` `runtimeConfig` | Add `newsletter: { baseURL, apiKey, audienceId }`, `mail: { baseURL, apiKey, from, to }`, `turnstile: { verifyURL, secretKey }`, and `public.turnstile: { scriptURL, siteKey }`, plus `public.submissionEmail` for the `mailto:` variant, every value `""` |
| 9 | `apps/huella-legal/.env.example`, `README.md` "🔑 Environment" | One row each: `NUXT_NEWSLETTER_BASE_URL`, `NUXT_NEWSLETTER_API_KEY`, `NUXT_NEWSLETTER_AUDIENCE_ID`, `NUXT_MAIL_BASE_URL`, `NUXT_MAIL_API_KEY`, `NUXT_MAIL_FROM`, `NUXT_MAIL_TO`, `NUXT_TURNSTILE_VERIFY_URL`, `NUXT_TURNSTILE_SECRET_KEY`, `NUXT_PUBLIC_TURNSTILE_SCRIPT_URL`, `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, and `NUXT_PUBLIC_SUBMISSION_EMAIL` for the `mailto:` variant |
| 10 | `app/pages/lab/publicar.vue:201` `<form>`, `:318` *Archivo*, `:332` `UCheckbox` | `mailto:` variant: the form block becomes a `mailto:` from `public.submissionEmail`, with the fields as a checklist of what to include, and the file goes as an ordinary attachment. Form variant: E2 wires the B4 form to `useSubmission`, the file help text states the 4 MB cap and the send-it-later fallback, and the first-layer notice sits by the checkbox |
| 11 | `app/lab/NewsletterBand.vue:28` `<form>`, `:56` notice; `app/pages/lab/category.vue:230` sidebar form | E1 wires every NewsletterForm variant to `useNewsletter`, and the notice names its recipients |
| 12 | `apps/huella-legal/app/pages/contacto.vue` (new, C6) | The form, built from B4's field patterns and wired to `useContact`. There is no lab design, so parity is checked against Publicar's form |
| 13 | `app/lab/SiteFooter.vue:7` "Contacto", `app/pages/lab/colaboradores.vue:57` and `estados.vue:221` *Contactar* | Link to `/contacto` |

## Options considered

| Option | Why not |
| --- | --- |
| Storage plus a link | Adds a storage vendor, a purge job for retention, and unpublished manuscripts behind links. It only beats the 4 MB cap with direct-to-storage presigned uploads, which is a second request flow |
| Netlify Forms | Its 8 MB request cap and built-in Akismet are real, but it binds the forms to Netlify while S2 is open. It needs a static HTML copy of each form for build-time detection, keeps the files at Netlify, and emails links rather than attachments |
| Brevo for mail | Its allowed attachment types exclude `.pages`. That only matters if Publicar keeps its form, so it gets a second look if E2 picks the `mailto:` |
| Postmark for mail | Free tier is 100 emails a month, the message cap is 10 MB, and Postmark has no plans for EU servers |
| Keeping the Mailchimp embed | It posts to Mailchimp's hosted page in a new tab, so none of the design's states ever render, and spam control stays with Mailchimp |
| reCAPTCHA v2, as today | A visible checkbox the design doesn't have, and Google's free 10,000 assessments need a billing instrument on a Cloud project |
| Akismet | A classifier for message text. It adds a vendor next to the challenge and does nothing for the newsletter's bare email |
| SMTP into the domain's own mailbox, with `nodemailer` | No new vendor and no DNS change. But it is a dependency, the mailbox password sits in an env var, the current host's sending limits are unknown, and it breaks if the site leaves that host |
| Contacto as a `mailto:` link | Not ruled out, only second: it puts the inbox address in every page's source and gives no confirmation or error state. It stays the fallback if the contact route is ever dropped |
| Contacto as the WP page | Its body is Fluent Form 1, which 0027's sanitiser strips |
| `zod` or `valibot` | Both resolve only transitively today (`zod` 3.25.76 comes through `@nuxt/content`). Three forms and twelve fields fit in one file, and `content` and `i18n` settled the same trade the same way. This row is the dependency check-in |

## Consequences

This unlocks E1 and E2, and gives C6 a `/contacto` page to build instead of a WP page to render.
Nothing here needs a new package or a `@monorepo/*` change.

**Order.**
1. Change 1 comes first, because both halves consume it and it is a pure Vitest node suite.
2. Then 2, 4, 5 and the newsletter half of 7, 8 and 9. That is E1, which needs no multipart handling.
3. Then 3, 6b and, *form only*, 6 (E2). The contact route rides with E2 because it shares E2's mail
   adapter.
4. The tickets still wait on B4 for 10 and 11, and C6 builds 12 once 6b exists.

**Owner decisions.** These are not code, and the site owner holds each one:
- Publicar as a `mailto:` or as a form, decided when E2 starts. Everything marked *form only* waits
  on it
- how long the inbox keeps a submission that is not accepted, which the privacy policy has to state
- *form only*: whether the name stays required, since the live guide prefers anonymous submissions and the lab
  requires *Nombre y apellidos*
- which Mailchimp plan the audience is on. Free caps at 250 contacts and 500 sends a month, and the
  pricing page doesn't say whether Free includes API access
- where Fluent Form 2's entries go, and what happens to the entries Fluent Forms already stores in WP
- the rewritten legal text
- switching the three Fluent Forms off at cutover, since they keep accepting posts on the WP host
  otherwise

**Findings for the other spikes:**
- **S2.** The 4 MB cap (*form only*) is Netlify-specific. Functions default to US East (Ohio), and Resend stores
  account data in the US even when it sends from its EU region. The policy names both transfers.
- **S4.**
  - `/contacto/` keeps its path.
  - `/suscripcion/`, `/publicar-mi-articulo/` and `/publicar-tfm-tfg-derecho/` need 301 targets.
  - The cookie review covers Turnstile's script and drops reCAPTCHA's.
- **C6.** WP has no `privacidad` or `cookies` page. All three legal sections live in `aviso-legal`,
  on repealed law, so C6's three legal pages have no source until the owner writes one.

**Tripwires:**
- No literal endpoint or address goes in the repo: the embed's action URL, the audience ID, the
  reCAPTCHA sitekey and the contact address are all readable on the live site. That includes the
  vendor API roots, which is why 9 has `BASE_URL` and `VERIFY_URL` variables. Specs use `.test`
  hosts.
- Resend sends only from a domain verified with DNS records, so the owner adds them before the
  first send, and `NUXT_MAIL_FROM` has to be on that domain.
- Turnstile tokens are single-use and expire after 300 s, so a retry after a failed send must reset
  the widget rather than resend the old token.
- Web Crypto has no MD5, so the subscriber hash needs `node:crypto`. If S2 moves off Node, that has
  to stay available.
- An address that unsubscribed and signs up again sees success and gets nothing, because the request
  carries no `status`. Rejoining is left to Mailchimp's own flows.
- Mailchimp allows 10 simultaneous connections and answers a 429 past that, which maps to 502.
- *Form only*: `readMultipartFormData` buffers the whole body. That is only safe because the cap sits below the
  platform limit.
- Specs for `server/` stub Nitro's auto-imports as globals, per [the app's
  AGENTS.md](../../apps/huella-legal/AGENTS.md).

Revisit this if S2 leaves Netlify Functions, if messages pass Resend Free's 100 a day, or if the
newsletter leaves Mailchimp.

## Confirmation

| Claim | Check |
| --- | --- |
| One set of rules runs on both sides | `grep -rlE "validate(Newsletter\|Contact)" apps/huella-legal/app apps/huella-legal/server` lists a composable and a route for each |
| The route re-validates (*form only*) | A spec beside `submissions.post.ts`: `autora@` and an empty summary answer 422 naming `email` and `summary`, and the Resend stub is never called |
| The cap holds (*form only*) | The same spec: a file of 4 MB plus one byte answers 422 on `file` |
| A bot gets nothing | A spec per route: a filled honeypot answers success and neither adapter is called |
| Nobody is resubscribed | A `mailchimp.ts` spec: the body has `status_if_new: "pending"` and no `status` key |
| Contacto sends through the shared pipe | A spec beside `contact.post.ts`: a valid body calls the Resend stub once, with no attachment and Reply-To set to the sender |
| No endpoint is committed | `git grep -niE "list-manage\|api\.mailchimp\|api\.resend\|challenges\.cloudflare" -- apps/huella-legal` finds nothing, and neither does a `git grep` for the live hostname |
| Every variable is documented | Each `NUXT_` name from 9 appears in both `apps/huella-legal/.env.example` and the README's 🔑 table |
