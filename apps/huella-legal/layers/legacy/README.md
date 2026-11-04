# 🔀 legacy

The WordPress theme served `www` before this app did, and the app took over the same domain. Posts
and most pages kept their URLs, but some WordPress archives were renamed, and an indexed or linked
URL that 404s costs readers and rankings. This layer sends every one of those to its new home, per
[0028](../../../../docs/decisions/0028-huella-legal-urls-and-cutover.md), and does nothing else.

## 🗂 Structure

| Old URL | Goes to | Where |
| --- | --- | --- |
| `/categorias/`, `/Categoria/<slug>/` | `/areas/`, `/areas/<slug>/` | [`nuxt.config.ts`](./nuxt.config.ts) |
| `/Etiqueta/<slug>/` | `/etiquetas/<slug>/` | `nuxt.config.ts` |
| `/author/<slug>/` | `/colaboradores/<slug>/` | `nuxt.config.ts` |
| `/publicar-mi-articulo/` and its child | `/publicar/` | `nuxt.config.ts` |
| Its grandchild, the theses list | `/etiquetas/trabajos-de-fin-de-grado/` | `nuxt.config.ts` |
| `/noticias/`, `/page/<n>/` | `/publicaciones/` | `nuxt.config.ts` |
| `/comments/feed/` | `/feed/` | `nuxt.config.ts` |
| Yoast's four sitemaps | `/sitemap.xml` | `nuxt.config.ts` |
| `/?s=<term>` | `/buscar/?query=<term>` | [`legacy.ts`](./server/middleware/legacy.ts): a route rule can't match a query |
| `/wp-content/…`, `/wp-admin/…`, `/wp-login.php`, `/wp-json/…` | The same path on `content.vendor.baseURL` | `legacy.ts`: the WordPress host is runtime config |

Every redirect is a 301. Netlify serves the rules from `_redirects` before Nitro runs, so a
`nuxi preview` exercises only Nitro's copy of them; `e2e/legacy.spec.ts` walks one URL per family
against that copy.

## 🚚 The cutover

The `/wp-*` forward does nothing while `content.vendor.baseURL` is the request's own host, which it
is until WordPress moves to its own hostname, so the layer ships safely before the switch. The
switch itself is DNS and WordPress settings, in the order 0028's step table gives. Once the new host
exists, the `content.vendor.baseURL` literal and `image.domains` in the app's
[`nuxt.config.ts`](../../nuxt.config.ts) change to it.

To check the deployed rules once, on a preview and then on production:

```sh
NITRO_PRESET=netlify pnpm exec nuxt build && grep -vE '\s301$' dist/_redirects  # prints nothing
curl -so /dev/null -w '%{http_code} %{redirect_url}\n' https://<host>/Categoria/<slug>/
```

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Body links straight to the new homes | Old post bodies link to `www` by absolute URL and still resolve, images included, through one 301. Rewriting them to root-relative, and uploads to the WordPress host, is 0028's change 6 in the body pipeline |
| `/?p=<id>` | It renders the home page. Mapping it needs a query map of every post ID, for a URL only WordPress's `shortlink` emitted |
| Dropping the layer | Once Search Console shows no traffic to the old families, delete the directory |
