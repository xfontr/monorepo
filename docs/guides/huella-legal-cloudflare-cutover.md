# 🚚 Moving Huella Legal to Cloudflare Pages

This guide moves `www.huellalegal.com` from the WordPress theme on Zume to the Nuxt app on
Cloudflare Pages. WordPress keeps running on Zume, behind its own subdomain `cms.huellalegal.com`,
which serves both its dashboard and its REST API. The top half is a click-by-click checklist. The
bottom half is the full plan behind it, and it points at the code and decision reports involved.

## 🪜 The simple guide

**Where you end up:**
- `www.huellalegal.com` is the new site, on Cloudflare Pages.
- `cms.huellalegal.com/wp-admin` is the WordPress dashboard, still on Zume.

Do the steps in order and don't skip ahead. The current site keeps working exactly as it does today
until step 17.

### 1️⃣ Give WordPress a second address

1. **Zume:** log in, open the WordPress site, and find "Domains" (or "Aliases"). Add
   `cms.huellalegal.com` as an **alias of the same site**. Don't create a new site.
2. **Cloudflare:** go to huellalegal.com, then **DNS**. Find the `www` row and copy its **Content**
   (an IP address or a hostname).
3. Still on DNS, click **Add record**:
   - Type: the same type as `www` (A or CNAME)
   - Name: `cms`
   - Content: the value from step 2
   - Proxy: orange cloud **on**
   - Click Save.
4. **Zume:** turn on SSL / Let's Encrypt for `cms.huellalegal.com`.
   - If it fails, set the `cms` record in Cloudflare DNS to grey cloud, retry on Zume, and then set
     it back to orange.
5. **Cloudflare:** go to **SSL/TLS** and check that the mode is **Full (strict)**.
6. **Test it:** open `https://cms.huellalegal.com/wp-json/` in a browser. A page of code-like text
   (JSON) means it works. ✅

### 2️⃣ Update the code

7. Make the code changes in [the full plan's phase 2](#2-code-changes). They point the app at
   `cms.huellalegal.com` and switch images to Cloudflare. Merge them into `master`.

### 3️⃣ Create the Cloudflare Pages site (nobody sees it yet)

8. **Cloudflare:** go to **Workers & Pages → Create → Pages → Connect to Git** and pick the GitHub
   repo.
9. Fill in the build settings:
   - Framework preset: **None**
   - Build command: `pnpm exec nx build @monorepo/huella-legal`
   - Output directory: `apps/huella-legal/dist`
   - Root directory: leave it empty
   - Production branch: `master`
10. **Settings → Variables and Secrets.** Add these:
    - `NODE_VERSION`: the number in the repo's `.nvmrc`
    - `PNPM_VERSION`: the number after `pnpm@` in the root `package.json`
    - `NUXT_SITE_ENV`: `production` for Production, `preview` for Preview
    - Every name in [`.env.example`](../../apps/huella-legal/.env.example), with the values copied
      from Netlify. Mark keys and passwords as **Secret**.
11. **Settings → Runtime → Compatibility flags:** add `nodejs_compat`.
12. **Turnstile** (Cloudflare sidebar): open the widget and add `www.huellalegal.com` and
    `<project>.pages.dev` to its hostnames.
13. **Images → Transformations:** enable them for huellalegal.com.
14. Click **Retry deployment** (or push anything) and wait until it's green.
15. **Test the preview:** open `https://<project>.pages.dev` and click around:
    - a post
    - page 2 of Publicaciones
    - a search
    - the contact form
    - a comment

    Images should show. If you see "exceeded CPU" errors, upgrade to **Workers Paid ($5/month)**.

### 4️⃣ Switch over (a quiet hour, about 30 minutes)

16. **Cloudflare:** check **Rules** and **Speed → Optimization**. If "APO for WordPress" or a "Cache
    Everything" rule applies to `www`, turn it off.
17. **Workers & Pages → the project → Custom domains → Add** `www.huellalegal.com`. When Cloudflare
    asks to replace the existing DNS record, click **yes**.
    🔀 *From this moment, `www` is the new site.*
18. Add `huellalegal.com` (without www) as a custom domain too.
19. **Zume → File manager:** open `wp-config.php` and paste these two lines above
    `/* That's all, stop editing! */`, then save:
    ```php
    define('WP_HOME', 'https://cms.huellalegal.com');
    define('WP_SITEURL', 'https://cms.huellalegal.com');
    ```
20. **Zume:** purge the LiteSpeed cache.
21. **Cloudflare → Rules → Redirect Rules → Create rule.** This sends anyone who lands on an old
    WordPress page at `cms` to the new site:
    - Name: `cms to www`
    - When: Hostname equals `cms.huellalegal.com` **and** URI Path does **not** start with
      `/wp-json/`, `/wp-admin/`, `/wp-login.php`, `/wp-content/` or `/wp-includes/`
    - Then: Dynamic redirect to `concat("https://www.huellalegal.com", http.request.uri.path)`,
      status **301**, preserve query string **on**
    - Click Deploy.
22. **Cloudflare → Caching → Purge Everything.**

### 5️⃣ Check it worked

23. Open `https://www.huellalegal.com`. You should see the new site. ✅
24. Open `https://cms.huellalegal.com/wp-admin` and log in. You should see the dashboard. ✅
25. Open `https://www.huellalegal.com/wp-admin`. It should jump to the `cms` address. ✅
26. Leave a test comment on a post. It should appear in WordPress under Comments. ✅
27. **Google Search Console → Sitemaps:** submit `sitemap.xml`.

### 😱 If something breaks during steps 17–22

- **Cloudflare:** remove the custom domains from the Pages project. In DNS, put the old `www`
  record back with the value from step 2.
- **Zume:** delete the two lines added to `wp-config.php`.

That puts everything back the way it was.

### 6️⃣ A few days later

28. Delete the site on Netlify.
29. Do the cleanup in [the full plan's phase 5](#5-cleanup).

## 🗺 The full plan

### Context

The repo is already set up for this move:
- [`layers/legacy`](../../apps/huella-legal/layers/legacy/README.md) 301s `/wp-admin`,
  `/wp-login.php`, `/wp-json` and `/wp-content` to `content.vendor.baseURL`. It does nothing until
  that value points at a different host.
- [0028](../decisions/0028-huella-legal-urls-and-cutover.md) has the cutover order: new WP host →
  app env → DNS → WP Site URL → redirect rule. It was written for Netlify, and the steps below adapt
  it to Pages.
- [0033](../decisions/0033-huella-legal-hybrid-prerender.md) prerenders posts and most pages as
  static HTML, which works on any host. Only listings, search, `/api/*` and the forms need the
  server function.

These pieces are tied to Netlify and behave differently on Pages:

| Piece | On Pages |
| --- | --- |
| `isr` route rules and `Netlify-Vary` in [`rendering.ts`](../../apps/huella-legal/modules/rendering.ts) | The Cloudflare preset ignores them. Listings and search run the Worker on every request, with only the in-isolate content cache in front. That's fine at this traffic, but it is a regression |
| `netlify-cdn-cache-control` in [`cdn.ts`](../../apps/huella-legal/server/plugins/cdn.ts) | Harmless while nothing caches on the CDN |
| `@nuxt/image`'s provider | Netlify's image CDN was auto-picked. On Pages it falls back to `ipx`, which needs `sharp` and can't run in a Worker, so **this one has to change** |
| `netlify.toml`, `netlify-ignore.sh`, `netlify-deployment.yml`, `NETLIFY_BUILD_HOOK_URL` | Replaced by Pages' build watch paths, its own deploy list and a Pages deploy hook |

**The CMS subdomain must work before the first Pages build**, because the build prerenders every
post by calling the WP API.

### 1. WordPress on a second hostname

WP answers on both `www` and `cms` until the cutover, so nothing breaks at this stage.

| Step | Detail |
| --- | --- |
| Alias | `cms.huellalegal.com` on the **same** Zume install and docroot. An "addon domain" pointed at the existing WP folder works too |
| DNS | A `cms` record with the same target as `www`, Proxied |
| TLS | SSL/TLS is **Full (strict)**, so the origin needs a certificate valid for `cms`: either Let's Encrypt from Zume (grey cloud during issuance if the HTTP challenge fails behind the proxy), or a Cloudflare Origin CA certificate for `*.huellalegal.com` installed in Zume |
| Check | `curl -s https://cms.huellalegal.com/wp-json/wp/v2/posts?per_page=1` returns JSON |

### 2. Code changes

| File | Change |
| --- | --- |
| [`nuxt.config.ts`](../../apps/huella-legal/nuxt.config.ts) | A `CMS_URL = "https://cms.huellalegal.com"` const, used for `content.vendor.baseURL`. `image.domains` becomes `["cms.huellalegal.com", "www.huellalegal.com"]`, because old post bodies link to `www/wp-content/…`. It is a public value that is the same in every environment, so a literal is right |
| same | `image.provider: "cloudflare"` with `cloudflare: { baseURL: SITE_URL }`, so `*.pages.dev` previews also resize through the zone's `/cdn-cgi/image/`. Check that the modifiers the components pass (`fit`, sizes) map onto that provider |
| [huella-legal README](../../apps/huella-legal/README.md) 🚢 Deployment and 🗄 Rendering | Describe Pages: build settings, watch paths, the env split, the deploy hook, and the `isr` gap |
| [legacy README](../../apps/huella-legal/layers/legacy/README.md) | The `_redirects` check builds with `NITRO_PRESET=cloudflare_pages`. That preset writes `_redirects` from route rules too, in `writeCFPagesRedirects` in `nitropack/dist/presets/cloudflare/utils.mjs` |
| [`submission.ts`](../../apps/huella-legal/layers/publish/shared/schemas/submission.ts) | Its comment cites Netlify's 6 MB buffer. Reword it to whatever still justifies the cap |

To check the build locally:

```sh
cd apps/huella-legal
NITRO_PRESET=cloudflare_pages NUXT_SITE_ENV=preview pnpm exec nuxt build
ls dist/_worker.js dist/_routes.json && grep -vE '\s301$' dist/_redirects  # only the 404 fallback
```

Then run `pnpm check` from the root, with a long timeout.

### 3. The Pages project

| Setting | Value | Why |
| --- | --- | --- |
| Framework preset | None | Nitro detects Pages through `CF_PAGES` and picks `cloudflare_pages` |
| Root directory | The repo root | It's a pnpm monorepo |
| Build command | `pnpm exec nx build @monorepo/huella-legal` | |
| Output directory | `apps/huella-legal/dist` | |
| `NODE_VERSION`, `PNPM_VERSION` | From `.nvmrc` and the root `packageManager` | The build image doesn't read them from the repo |
| `NUXT_SITE_ENV` | `production` / `preview` per environment | It switches prerendering on, and production fails the build on missing secrets |
| Secrets | Every name in `.env.example` | Pages exposes them to the build and the function, which the production-build check needs |
| Compatibility flag | `nodejs_compat` with a recent date | |
| Build watch paths | Include `apps/huella-legal/*`, `packages/content/*`, `packages/observability/*`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package.json`, `.nvmrc`; exclude `**/*.md`, `**/*.spec.ts`, `apps/huella-legal/e2e/*` | Replaces [`netlify-ignore.sh`](../../apps/huella-legal/netlify-ignore.sh), whose list is the source |
| Turnstile hostnames | `www.huellalegal.com`, `<project>.pages.dev` | Otherwise the forms fail their challenge |
| Image Transformations | Enabled, with `cms` and `www` as source origins | The cloudflare image provider needs them |
| Deploy hook | One on `master`, stored as the rebuild workflow's secret | Replaces the Netlify build hook |

The Workers Free plan caps CPU at **10 ms per request**. Prerendered pages are static and don't
count, but SSR of a listing or search will likely exceed it. If previews show error `1102` or
"exceeded CPU", the site needs Workers Paid ($5/month).

On the preview, walk the Confirmation table in 0028.

### 4. Cutover

Do the steps in this order. Each one names what goes wrong out of order.

| Step | Action | Out of order |
| --- | --- | --- |
| 1 | Turn off APO for WordPress, "Cache Everything" Cache Rules and Page Rules on `www`, or rescope them to `cms` | They cache the app's responses as if they were WordPress's |
| 2 | Pages → Custom domains → `www.huellalegal.com`, accepting the DNS record replacement. Then the apex, or a Redirect Rule `huellalegal.com/*` → `https://www.huellalegal.com/${1}` 301, since `site.url` is `www` | — |
| 3 | `WP_HOME` and `WP_SITEURL` → `https://cms.huellalegal.com` in `wp-config.php`. Purge LiteSpeed | Done before step 2, WP 301s `www` visitors to `cms` and browsers cache it. Settings → General can't do this, because after step 2 its form posts to `www`, which is Pages |
| 4 | A Redirect Rule on host `cms.huellalegal.com`: any path outside `/wp-json/`, `/wp-admin/`, `/wp-login.php`, `/wp-content/` and `/wp-includes/` 301s to the same path on `www`, query kept | Done before step 3, it loops |
| 5 | Purge Cloudflare's cache | — |

To smoke-test:

```sh
curl -so /dev/null -w '%{http_code} %{redirect_url}\n' https://www.huellalegal.com/wp-admin/
# → 301 https://cms.huellalegal.com/wp-admin/  (legacy layer)
curl -so /dev/null -w '%{http_code} %{redirect_url}\n' https://cms.huellalegal.com/some-post/
# → 301 https://www.huellalegal.com/some-post/  (redirect rule)
```

Then:
- Log in at `cms…/wp-admin` and publish a test draft.
- Post a comment and check that it reaches moderation.
- `www` doesn't change, so Search Console needs no change of address. Submit `/sitemap.xml` there.

**Rollback:** remove the Pages custom domains, restore the old `www` record, and delete the two
`define`s. WP answered on both hosts throughout, so this is the exact prior state.

### 5. Cleanup

| What | Detail |
| --- | --- |
| Netlify | Delete the site |
| Repo | Delete [`netlify.toml`](../../netlify.toml), `netlify-ignore.sh` and [`netlify-deployment.yml`](../../.github/workflows/netlify-deployment.yml). Point [`huella-legal-rebuild.yml`](../../.github/workflows/huella-legal-rebuild.yml) at the Pages deploy hook under a host-neutral secret name, and update [`repo-secrets.md`](./repo-secrets.md) |
| Old body links | Optional: `wp search-replace 'https://www.huellalegal.com/wp-content' 'https://cms.huellalegal.com/wp-content'` saves old bodies one 301. 0028's change 6 handles both hosts anyway |
| Decision record | [0030](../decisions/0030-huella-legal-rendering-hosting-and-cost.md) still records Google Cloud as the chosen host |

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| CDN caching for listings and search | Replace `isr` and `Netlify-Vary` in `rendering.ts` with Cloudflare caching, either the Cache API in a Nitro plugin or `s-maxage` plus a Cache Rule, and move the `no-store` guard in `cdn.ts` to the matching header |
| Workers instead of Pages | Cloudflare steers new projects to Workers with static assets. Moving means the `cloudflare_module` preset and a `wrangler` config in the app, with the same DNS and WordPress steps |
