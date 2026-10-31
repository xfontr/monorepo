---
issue: none filed
status: implemented
decision: accepted
---

# 🧭 Huella Legal's reader comments

## Context

The WordPress site shows reader comments under its articles: [0027](./0027-huella-legal-content-model.md)
counted 134 approved ones and deferred them, and [`DESIGN.md`](../../apps/huella-legal/DESIGN.md)
dropped them "pending a moderation decision". The cutover in
[0028](./0028-huella-legal-urls-and-cutover.md) keeps only `/wp-json/`, `/wp-admin/`, `/wp-login.php`,
`/wp-content/` and `/wp-includes/` on the WordPress host, so `wp-comments-post.php` and every
comment WordPress renders disappear with it. Without a decision, the existing comments vanish and
nobody can post one.

## Result

Comments stay in WordPress. The app reads and posts them through its REST API, and the editors
moderate them in wp-admin as they do today.

| Concern | Where | What it does |
| --- | --- | --- |
| Reading | [`layers/articles/server/adapters/wordpress.ts`](../../apps/huella-legal/layers/articles/server/adapters/wordpress.ts) | Unauthenticated `GET /wp/v2/comments`, which answers approved comments only, and the post's `comment_status` |
| Threads | [`toArticleComments`](../../apps/huella-legal/layers/articles/server/mappers/articleComments.ts) | Every reply hangs under its top-level comment, naming whom it answers when nesting is flattened |
| Plain text | [`toReaderComment`](../../apps/huella-legal/layers/articles/server/mappers/readerComment.ts) | Each block of `content.rendered` becomes a string; nothing reaches the page through `v-html` |
| Freshness | [`modules/rendering.ts`](../../apps/huella-legal/modules/rendering.ts) | `/api/articles/*/comments` is `isr` 600, and the article page reads it in the browser, since the article itself is prerendered weekly |
| Counts | [`getCommentCounts`](../../apps/huella-legal/layers/articles/server/services/commentCounts.ts) | Every approved comment's `post`, cached for the articles window and merged onto the card routes' summaries |
| Posting | [`layers/comments/server/adapters/wordpress.ts`](../../apps/huella-legal/layers/comments/server/adapters/wordpress.ts) | `POST /wp/v2/comments` with an application password, as the reader, with `status: "hold"`, their IP and user agent |
| Spam | [`layers/forms`](../../apps/huella-legal/layers/forms) and WordPress | The honeypot and Turnstile in front, Akismet behind |

Every new comment waits for approval. That makes the 10-minute window harmless: a fresh comment
isn't public yet, so the cache can't hide it, only delay an approval.

The posting user must hold `moderate_comments`, which in stock WordPress means Editor. Only that
capability lets a request set `status`, `author_ip` and author fields other than its own. That
user also has `unfiltered_html`, so kses never runs on what it posts: the route escapes the content
and drops `<>` from the name before WordPress sees them.

## Options considered

| Option | Why not |
| --- | --- |
| A hosted service (Disqus, Hyvor, Remark42, Cusdis) | A vendor, a third-party script on the article and a second moderation UI, plus importing the 134 comments, while WordPress stays the CMS anyway |
| Turn on `rest_allow_anonymous_comments` | `/wp-json/` stays public after cutover, so anyone could post past the honeypot and Turnstile straight to WordPress |
| Gravatar avatars | A request to a third party per commenter on every article view, keyed on a hash of their email; initials do the same job |
| Comments in the prerendered article | The thread would only change on the weekly rebuild |

## Consequences

Akismet is the exception to 0029, which says none of WordPress's form wiring survives the cutover:
it stays active on the headless WordPress, because comments still pass through it. The cutover
checklist in 0028 has to leave it on while Fluent Forms and reCAPTCHA go.

The application password is editor-grade. A leak lets someone edit posts, so it lives only in
Netlify's env and rotates from the user's profile in wp-admin.

Card counts are as fresh as the page they're on: a day on the ISR listings, until the weekly
rebuild on prerendered pages such as `/areas/`. The article's own count is always live.

**Tripwires.** None of the WordPress behaviour below was probed against the live site, which
blocked the machine this was built on. Each is a string or one field to change if it doesn't hold:

- `status: "hold"` is applied after insert. If it moves an Akismet-spammed comment back to Pending,
  drop the field and tick "Comment must be manually approved" in Settings → Discussion instead.
- `author_ip` must be what Akismet logs, not Netlify's or Cloudflare's address.
- The refusal codes `comment_duplicate`, `comment_flood` and `rest_comment_closed` map to `409`,
  `429` and `410`; any other refusal is a `502`.
- A Cloudflare or WordPress firewall rule that blocks datacenter IPs blocks the Netlify functions
  too, and every read becomes a `502`.

Revisit if comments outgrow one page of 100 per article, or if the editors stop moderating every
comment by hand.

## Confirmation

The specs beside each file above pin the behaviour, and
[`e2e/comments.spec.ts`](../../apps/huella-legal/e2e/comments.spec.ts) reads a thread, replies and
gets the moderation message against the faked WordPress. Against the real one, a comment posted
from a deploy preview must land in wp-admin's Pending queue under the reader's name and IP, and a
comment by `akismet-guaranteed-spam` must land in Spam.
