# 🔐 Security policy

Huella Legal is a public site with public forms, so a hole in it reaches readers before it reaches
us. Report one privately and it gets fixed before anyone else learns of it.

## 📮 Reporting a vulnerability

Use GitHub's **Report a vulnerability** button on this repository's *Security* tab. It opens a
private advisory that only the maintainers see. Please don't open a public issue or pull request
for it.

| Include | Why |
| --- | --- |
| The URL or file, and the request or input that triggers it | So it can be reproduced without guessing |
| What an attacker gains | It decides how fast the fix ships |
| Whether you tested against the live site | Testing belongs on a deploy preview, never on `www.huellalegal.com` |

## 🎯 Scope

| In scope | Out of scope |
| --- | --- |
| `apps/huella-legal` and the packages it ships: its BFF routes, forms and rendered HTML | Volumetric denial of service, which the hosting platform's edge absorbs |
| The workflows in `.github/workflows` | The WordPress origin and its plugins, which run outside this repository |
| A secret committed anywhere in the history | Missing headers or banners that carry no exploit |

How the site defends itself is in the huella-legal README's
[abuse and hardening](./apps/huella-legal/README.md#-abuse-and-hardening) section.
