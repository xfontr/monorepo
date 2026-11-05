---
issue: 186
status: wont-implement
decision: superseded
supersededBy: 0033-huella-legal-hybrid-prerender.md
---

# 🧭 Huella Legal's rendering, hosting and cost

## Context

S2 in [the implementation plan](../plans/huella-legal-implementation.md) weighs Nitro on
Cloudflare Workers against a full static build with third-party services. It asks for the cost at
expected traffic, where the content cache persists, time-based revalidation (WP is read-only and has
no webhooks), the function body limit against Publicar's upload, preview deploys, where translations
come from in production, and whether static can do search. The plan's fact table already notes that
the app has no preset, no `routeRules` and no Nitro storage. S1
([0027](./0027-huella-legal-content-model.md)) and S3
([0029](./0029-huella-legal-forms-and-integrations.md)) each left S2 a finding.

## Result

Vendor pages were read on 29 Sep 2026, and the app was built under the `cloudflare_module` preset of
Nitro 2.13.4. The repo holds no traffic figure (Site Kit answered 401 in 0027).

**Owner decision, 30 Sep 2026: the app deploys on Google Cloud directly, for full control over the
stack, and WordPress stays on the owner's own provider.** Google's pages were read the same day:

| Concern | On Google Cloud |
| --- | --- |
| Runtime | Nitro has no Cloud Run preset. The default `node-server` output runs in a container, listens on the `PORT` Cloud Run injects, and reads `NUXT_*` from the service's env vars. `firebase_app_hosting` is the Firebase route |
| Region | `europe-southwest1` (Madrid) runs Cloud Run at Tier 1 prices |
| Billing | Request-based billing includes 2M requests, 180,000 vCPU-seconds and 360,000 GiB-seconds free a month. It gives CPU only while a request is in progress, so Nitro's SWR refresh starves after the response. Instance-based billing (`--no-cpu-throttling`) keeps CPU on, which Nitro's in-memory SWR needs. The free egress is North America only |
| Body limit | 32 MiB on HTTP/1, which `node-server` speaks, so 0029's 4 MB cap can rise |
| CDN | Cloud CDN needs an external Application Load Balancer with a serverless NEG, about $18 a month for the forwarding rule, plus cache egress from $0.08/GiB in Europe. It honours `s-maxage` and, with `serveWhileStale`, `stale-while-revalidate`. It caches HTML and JSON only with explicit directives, and never a response carrying `Set-Cookie`. Firebase Hosting in front is the cheaper route. It has a 60 s timeout, its docs don't mention `stale-while-revalidate`, and a deploy clears its cache |
| Custom domain | Cloud Run's domain mapping is in Preview and not offered in Madrid, so `www` goes through the load balancer or Firebase Hosting |
| Previews | `gcloud run deploy --no-traffic --tag <tag>` gives a revision its own URL. `google-github-actions/deploy-cloudrun` wraps it, using Workload Identity Federation |
| Build | Cloud Build has 2,500 free minutes a month, a promotional allowance. Artifact Registry stores 0.5 GiB for free |

Two questions have answers that don't depend on the host:

| Question | Answer |
| --- | --- |
| Translations | Hosting rules out only `internal`: no workflow deploys [`infrastructure/translations`](../../infrastructure/translations/README.md), so it would be a second always-on service. Tolgee Free (30,000 words, 3 seats) needs only the cache rule, though its cloud rate limits are undocumented. Baking in needs a new `@monorepo/i18n` provider. With the upstream unreachable, a local build still answered `/` with 200 and logged `Failed to load messages`, so a Tolgee outage caches raw keys for a TTL. A2 (#193) made a provisional pick for early development: `internal` under `nuxt dev` only, Tolgee for every build. When that phase ends the app is expected to move to Tolgee only |
| Search in static mode | Possible, per 0027's CORS finding, but moot: static loses |

## Options considered

| Option | Why not |
| --- | --- |
| Nitro on Cloudflare Workers | Cheaper at any traffic: static requests and egress are free, the body limit is 100 MB against 0029's 4 MB, and the preset wires `waitUntil`. It builds (408 kB gzipped against a 64 MiB limit). But `cloudflare_module` has no `isr`, so SSR caching means KV, whose 1,000 free writes a day sit below the refresh ceiling, or the new Workers Cache, which bills hits as requests. The build warns *"Node.js compatibility is not enabled"*. `observability.ts:20` reads runtime config at plugin setup, and Nitro's Cloudflare page makes env available only inside a request. `www` would need a Custom Domain on an active Cloudflare zone |
| Full static, with third-party forms and search | 0029's routes hold the Mailchimp, Resend and Turnstile secrets, S4's middleware reads the WP host at runtime, and 0027 sanitises server-side. With no webhooks, new posts appear only through scheduled rebuilds, and an hourly rebuild is 720 production deploys a month |
| `swr` route rules | They cache in Nitro memory, per instance, and send `s-maxage` without `durable`, so every edge node misses separately into a function |
| No rules, as today | Every page view is an invocation into a cold, per-instance memory cache |

## Consequences

These findings hold on any host:
- Browsers fetch `/api/content/*` and `/_i18n/…` directly, so a CDN rule for pages alone
  misses them.
- A CDN needs a guard to keep 5xx responses out of it. Nitro's `error` hook can set one, and
  `beforeResponse` can't.
- A translations outage renders a 200 with raw keys, which a cache keeps.
- `/robots.txt` varies by host.
- The span flush in `observability.ts:54` is needed wherever CPU stops after the response.
- 84 commits in 27 days means deploy cadence sets the build bill.

S4's cutover steps stand as written.

**Owner decision.**
- Whether up to about 12 hours is acceptable for a correction to reach a live post: a CDN refresh
  can pull a 6-hour item from a warm instance. The fallback is the build hook, whose URL stays out
  of the repo like every other endpoint.

**Tripwires.**
- A list can reach the CDN up to `LIST_MAX_AGE` old from a warm instance, so a new post can take
  about two hours to reach a listing, not one.
- The build prints two `unhandledRejection` traces from Node's ESM loader. They predate this work
  and are not the preset's.

## Confirmation

Nothing here was adopted, so nothing is confirmed.
