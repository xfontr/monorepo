---
issue: 186
status: wont-implement
decision: accepted
---

# 🧭 Huella Legal's rendering, hosting and cost

## Context

S2 in [the implementation plan](../plans/huella-legal-implementation.md) weighs three options:
Nitro on Netlify (SSR, or hybrid with `routeRules`), Nitro on Cloudflare Workers, and a full static
build with third-party services. It asks for the cost at expected traffic, where the content cache
persists, time-based revalidation (WP is read-only and has no webhooks), the function body limit
against Publicar's upload, preview deploys, where translations come from in production, and whether
static can do search. The lean was to stay on Netlify with hybrid `routeRules`. The plan's fact
table already notes that the app has no preset, no `routeRules` and no Nitro storage. S1
([0027](./0027-huella-legal-content-model.md)) and S3
([0029](./0029-huella-legal-forms-and-integrations.md)) each left S2 a finding.

## Result

Vendor pages were read on 29 Sep 2026, and the app was built under both the `netlify` and the
`cloudflare_module` preset of Nitro 2.13.4. The repo holds no traffic figure (Site Kit answered 401
in 0027), so cost is a formula, and the owner supplies its inputs.

**Owner decision, 30 Sep 2026: the app deploys on Google Cloud directly, for full control over the
stack, and WordPress stays on the owner's own provider.** Nothing below is adopted. The Netlify
findings stay as the record of that option, and the ones that don't depend on the host carry over.
Google's pages were read the same day:

| Concern | On Google Cloud |
| --- | --- |
| Runtime | Nitro has no Cloud Run preset. The default `node-server` output runs in a container, listens on the `PORT` Cloud Run injects, and reads `NUXT_*` from the service's env vars. `firebase_app_hosting` is the Firebase route |
| Region | `europe-southwest1` (Madrid) runs Cloud Run at Tier 1 prices |
| Billing | Request-based billing includes 2M requests, 180,000 vCPU-seconds and 360,000 GiB-seconds free a month. It gives CPU only while a request is in progress, so Nitro's SWR refresh starves after the response. Instance-based billing (`--no-cpu-throttling`) keeps CPU on, which Nitro's in-memory SWR needs. The free egress is North America only |
| Body limit | 32 MiB on HTTP/1, which `node-server` speaks, so 0029's 4 MB cap came from Netlify and can rise |
| CDN | Cloud CDN needs an external Application Load Balancer with a serverless NEG, about $18 a month for the forwarding rule, plus cache egress from $0.08/GiB in Europe. It honours `s-maxage` and, with `serveWhileStale`, `stale-while-revalidate`. It caches HTML and JSON only with explicit directives, and never a response carrying `Set-Cookie`. Firebase Hosting in front is the cheaper route. It has a 60 s timeout, its docs don't mention `stale-while-revalidate`, and a deploy clears its cache |
| Custom domain | Cloud Run's domain mapping is in Preview and not offered in Madrid, so `www` goes through the load balancer or Firebase Hosting |
| Previews | `gcloud run deploy --no-traffic --tag <tag>` gives a revision its own URL. `google-github-actions/deploy-cloudrun` wraps it, using Workload Identity Federation |
| Build | Cloud Build has 2,500 free minutes a month, a promotional allowance. Artifact Registry stores 0.5 GiB for free |

**The lean holds, with two corrections: the cache lives in Netlify's CDN rather than in Nitro, and on
a credit plan the dominant cost is deploys, not readers.**

| Question | Answer |
| --- | --- |
| Cost model | Credit plans charge 15 credits per production deploy, 20 per GB, 2 per 10,000 web requests and 10 per GB-hour, with functions fixed at 1,024 MB below Pro. Deploy previews cost 0. The billing pages don't exempt CDN hits or static assets from the request count. Free gets 300 credits under a hard limit, after which *"all of your web projects … are paused"*. Personal is $9 for 1,000 credits, with recharge. Accounts created before 4 Sep 2025 keep legacy limits: 300 build minutes, 125k invocations and 100 GB |
| Where the cache persists | Netlify's durable CDN cache, through `isr` route rules. No unstorage driver is used; see Options |
| Revalidation | Time only, with the TTLs below. Every deploy invalidates the CDN cache for its deploy context, so the manual purge is a build hook. A plain redeploy of the same commit diffs empty under change 1 and is cancelled, but *"The `ignore` command won't cancel a build triggered by a build hook"* |
| Upload | 6 MB buffered, which is 4.5 MB of binary after base64. 0029's 4 MB cap stands (*form only*) |
| Preview deploys | One per PR, for 0 credits, and the `deploy-preview` context gets its own env values. S4's robots rule keeps previews out of the index |
| Translations | Hosting rules out only `internal`: no workflow deploys [`infrastructure/translations`](../../infrastructure/translations/README.md), so it would be a second always-on service. Tolgee Free (30,000 words, 3 seats) needs only the cache rule, though its cloud rate limits are undocumented. Baking in needs a new `@monorepo/i18n` provider. With the upstream unreachable, a local build still answered `/` with 200 and logged `Failed to load messages`, so a Tolgee outage caches raw keys for a TTL. A2 (#193) made a provisional pick for early development: `internal` under `nuxt dev` only, Tolgee for every build. When that phase ends the app is expected to move to Tolgee only |
| Search in static mode | Possible, per 0027's CORS finding, but moot: static loses |

**Cost** in credits a month is `15·deploys + 20·GB + 2·(requests ÷ 10,000) + 10·GB-hours`.
- A first view of today's shell costs 9 requests and 375 KB compressed, measured locally. That comes
  to about 9.3 credits per 1,000 first views.
- Renders scale with URLs, not traffic: about 220 URLs, each refreshed at most once per TTL, cap them
  near 3,100 a day. 1 credit buys 360 function-seconds.
- From 3 to 29 Sep 2026, 84 commits reached `master`, and 42 of them touched the app, `packages/` or
  the pnpm files. Netlify builds every one, because there is no `ignore` command and its own skip
  checks only the base directory, which is the repo root.

| Plan | Allowance | 42 deploys | Left for readers |
| --- | --- | --- | --- |
| Free, credit-based | 300, hard limit | 630 | None: the site pauses |
| Personal, $9 | 1,000, recharge 500 for $5 | 630 | 370, about 40,000 first views |
| Free, legacy | 300 build minutes, 125k invocations, 100 GB | Build minutes, unmeasured on Netlify | 100 GB, about 260,000 first views |

**Why `isr`.** The paths are the installed preset's, under `nitropack/dist/`, and line numbers are as
of this report.
- `presets/netlify/runtime/netlify.mjs:42` turns `isr: N` into `Netlify-CDN-Cache-Control: public,
  max-age=N, stale-while-revalidate=31536000, durable`. The stale window is fixed at a year, so `N`
  is the delay before a background refresh.
- The app's own headers are spread after those (`:20`) and win. Netlify's caching page still says
  Nuxt can't set them and calls durable support "coming soon"; it lags the preset.
- `:9` takes only the `Request`, so `context.waitUntil` never reaches Nitro. That leaves
  `runtime/internal/cache.mjs:77-87`'s SWR refresh and storage write unawaited.
- The BFF already sends `s-maxage=3600, stale-while-revalidate=86400` (`cache.mjs:268`), which
  Netlify caches per edge node. Pages send nothing.
- On client navigation, browsers call `/api/content/*` and `@nuxtjs/i18n`'s own
  `/_i18n/<hash>/<locale>/messages.json`, which runs `loader.ts:4` in-process. Both need rules. SSR's
  calls run in-process too and never reach the CDN. The build turns i18n's own message cache off
  (`maxAge: -1`).

| Route rule | `isr` | `Netlify-Vary` | Why this TTL |
| --- | --- | --- | --- |
| `/**` (posts and pages at the root, per S4) | 21600 | — | `ITEM_MAX_AGE`: a warm instance holds the item that long anyway |
| `/` | 3600 | — | `LIST_MAX_AGE`. Every query parameter stays in the key, so S4's `/?s=` 301 is cached apart from the home page |
| `/publicaciones/**`, `/materias/**`, `/etiquetas/**`, `/colaboradores/**` | 3600 | `query=page\|sort\|tag` | `LIST_MAX_AGE` |
| `/buscar/**` | 3600 | `query=q\|page` | Same as lists; each query is its own entry |
| `/feed/`, `/sitemap.xml` | 3600 | — | They list what the listings list |
| `/robots.txt` | `false` | — | S4 answers `Disallow: /` off the canonical host, and Netlify's caching page doesn't say the host is in the key |
| `/api/**` | `false` | — | Keeps S3's POST routes out of `/**` |
| `/api/content/**` | 3600 | — | `LIST_MAX_AGE`. Only `useContent` calls it, with exact parameters, and 0027 adds `author` to them |
| `/_i18n/**` | 3600 | — | `TRANSLATIONS_MAX_AGE` |

| # | File | Change |
| --- | --- | --- |
| 1 | `apps/huella-legal/netlify.toml` (new) | `[build] ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- apps/huella-legal packages pnpm-lock.yaml pnpm-workspace.yaml"`. Netlify documents `ignore` only in the file. The command runs on Node 18 without the site's dependencies, so it can't call Nx. All of `packages/` costs no extra deploys: 42 either way |
| 2 | `apps/huella-legal/nuxt.config.ts:81`, above `nitro` | A top-level `routeRules` holding the table above, with `headers: { "Netlify-Vary": … }` where listed. S4's redirects go in the same block |
| 3 | `apps/huella-legal/server/plugins/cdn.ts` (new) | A Nitro `error` hook: when the error's `statusCode` is 500 or above, set `netlify-cdn-cache-control: no-store`. The preset sends the `isr` headers whatever the status, and Netlify's page doesn't say whether it stores a 5xx. Measured on a local build: `beforeResponse` never fires for a thrown 500 or 404, and a header set in `error` reaches the response |
| 4 | `apps/huella-legal/server/plugins/observability.ts:54` | Flush spans before the outermost request's response returns, since `BatchSpanProcessor` flushes only on `close`. That hook isn't guaranteed to run in a function, and the preset gives no `waitUntil`. Only CDN misses pay the export latency |
| 5 | `apps/huella-legal/README.md:30` 🚢 Deployment | Replace "there is no `netlify.toml`" with the ignore command and a pointer to this report's TTL table |

## Options considered

| Option | Why not |
| --- | --- |
| Nitro on Cloudflare Workers | Cheaper at any traffic: static requests and egress are free, the body limit is 100 MB against 0029's 4 MB, and the preset wires `waitUntil`. It builds (408 kB gzipped against a 64 MiB limit). But `cloudflare_module` has no `isr`, so SSR caching means KV, whose 1,000 free writes a day sit below the refresh ceiling, or the new Workers Cache, which bills hits as requests. The build warns *"Node.js compatibility is not enabled"*. `observability.ts:20` reads runtime config at plugin setup, and Nitro's Cloudflare page makes env available only inside a request. `www` would need a Custom Domain on an active Cloudflare zone. It also rewrites `netlify-deployment.yml`, 0029's platform limits and S4's `_redirects` tripwires |
| Full static, with third-party forms and search | 0029's routes hold the Mailchimp, Resend and Turnstile secrets, S4's middleware reads the WP host at runtime, and 0027 sanitises server-side. With no webhooks, new posts appear only through scheduled rebuilds, and an hourly rebuild is 720 production deploys a month, or 10,800 credits |
| Nitro storage on Netlify Blobs | Every request still invokes a function, so it only saves upstream calls. Writes float without `waitUntil`, stores sit in `us-east-2`, and `@netlify/blobs` isn't in the tree, which makes it a dependency check-in |
| `swr` route rules | They cache in Nitro memory, per instance, and send `s-maxage` without `durable`, so every edge node misses separately into a function |
| No rules, as today | Every page view is an invocation into a cold, per-instance memory cache |
| A purge on publish | It needs a webhook or a poller holding a Netlify token. A build hook already purges by hand |

## Consequences

With Google Cloud chosen, the change table, the order and the tripwires below record the Netlify
path that wasn't taken. F1 designs the Google Cloud deploy, starting from the table in Result. These
findings hold on any host:
- Browsers fetch `/api/content/*` and `/_i18n/…` directly, so a CDN rule for pages alone
  misses them.
- A CDN needs a guard to keep 5xx responses out of it. Nitro's `error` hook can set one, and
  `beforeResponse` can't.
- A translations outage renders a 200 with raw keys, which a cache keeps.
- `/robots.txt` varies by host.
- The span flush in `observability.ts:54` is needed wherever CPU stops after the response.
- 84 commits in 27 days means deploy cadence sets the build bill.

Two sibling reports assumed Netlify. S4's `_redirects` tripwires don't apply: `node-server` serves
route-rule redirects at runtime (`nitropack/dist/runtime/internal/route-rules.mjs:41`,
`sendRedirect`). 0029's recipient list names Netlify, where Google now belongs.
`netlify-deployment.yml` and the app README's 🚢 Deployment section describe the host being left.

This unlocks F1 and fixes E1 and E2 on Netlify's limits, which 0029 already assumed. S4's cutover
steps stand as written. Revisit this if deploys or traffic push the account past Personal, if the
body limit starts to matter, or if Nitro's Netlify preset starts passing `waitUntil`.

**Owner decisions.**
- Whether the Netlify account is on legacy or credit pricing, visible on its billing page. If it is
  credit-based, Free pauses the site at the current deploy rate, so production needs Personal.
- GA4's monthly page views, which turn the formula into a bill.
- Whether up to about 12 hours is acceptable for a correction to reach a live post: a CDN refresh
  can pull a 6-hour item from a warm instance. The fallback is the build hook, whose URL stays out
  of the repo like every other endpoint.

**Order.**
0. Before any preview check: the URL the last successful deploy (bb7d983) recorded answers
   Netlify's own "Page not found" on `/`, `/articles` and `/api/content/posts`. Either that URL
   isn't the site or the deploy serves no function, and F1 finds out which from the Netlify UI.
1. Change 1 first. It is independent of every page and cuts the deploy count in half at once.
2. Changes 2 and 3 land together, because rules without the guard keep errors in the cache. They
   land in F1, once S4 has fixed the route names.
3. Change 4 before `NUXT_OBSERVABILITY_URL` is set in production.
4. Change 5 with 2.

**Tripwires.**
- Nitro auto-detects Netlify, but a local build is `node-server`. Reproduce the preset with
  `NITRO_PRESET=netlify`, and delete `apps/huella-legal/dist` and `.netlify` afterwards: `.netlify`
  isn't in `.gitignore`.
- Netlify reads `netlify.toml` from the site's package directory, and from the root if none is set.
  That setting lives in the Netlify UI, so check it before placing change 1.
- Netlify requires *"Any given URL should return the same `Netlify-Vary` header across all
  responses"*. Keep it in `routeRules`, never per handler.
- The `Netlify-Vary` keys on listings have to match C2's URL keys. Rename one and the other goes
  with it.
- Never give `/` a `Netlify-Vary`. Non-matching query strings share the bare URL's entry, so a
  cached `/?s=` 301 would redirect the home page.
- Internal `$fetch` calls pass through the same wrapped handler, so change 4 flushes once, when the
  outermost span ends.
- A list can reach the CDN up to `LIST_MAX_AGE` old from a warm instance, so a new post can take
  about two hours to reach a listing, not one.
- Change 3 can't see a 200 rendered with raw translation keys. Only A2's vendor choice removes that
  failure.
- Functions run in US East (Ohio) below Pro, and the durable cache sits beside them. Only misses pay
  the hop to Spain.
- Both presets print two `unhandledRejection` traces from Node's ESM loader during the build. They
  predate this work and are not the preset's.
- The Netlify site URL stays out of the repo, like every other host.

## Confirmation

| Claim | Check |
| --- | --- |
| Unaffected commits don't deploy | The Netlify log for a docs-only merge ends at the ignore command with exit 0, and Netlify's deploy list shows no new production deploy |
| The rules are compiled in | `NITRO_PRESET=netlify pnpm exec nx build @monorepo/huella-legal --skip-nx-cache`, then `grep -o '"isr":[a-z0-9]*' apps/huella-legal/.netlify/functions-internal/server/chunks/nitro/nitro.mjs \| sort \| uniq -c` lists 21600, 3600 and `false` |
| Pages come from the CDN | On a preview, the second `curl -sI` of a post path shows `hit` in `cache-status` |
| Stray query strings share a listing's entry | On a preview, `curl -sI "<preview>/publicaciones/?page=2&utm_source=x"` right after `?page=2` shows `hit` |
| The home page never redirects | On a preview, request `/?s=derecho`, then `/`: the second answers 200 |
| Errors aren't stored | On a preview with `NUXT_CONTENT_VENDOR_BASE_URL` pointed at an unreachable host, a post answers 500, and a second request's `cache-status` shows no `stored` |
| Spans leave the function | With `NUXT_OBSERVABILITY_URL` set on a preview, one request's trace reaches Grafana with no second request following it |
| No host is committed | `git grep -n "netlify\.app" -- apps/huella-legal docs` finds nothing |
