---
issue: 144
status: implemented
decision: accepted
---

# 🧭 The developer portal gets one intent-led public front door

## Context

The developer portal began as an internal DX surface: a searchable wiki beside coverage, the Nx
graph, dependencies, issues, decisions and repository reviews. It is now also the public, statically
served introduction to an open-source monorepo. #144 asks how it should serve two expected
personas — developers and "regular people" — and whether selecting a persona on launch should
produce two different sets of features.

The current interface serves the first persona well after they already understand the repository.
The sidebar in `app/layouts/default.vue:12` gives eleven technical destinations equal weight, the
Overview in `app/pages/index.vue:50` opens with repository-health counters, and its "What's next"
at `app/pages/index.vue:146` means open GitHub issues. The Projects catalog at
`app/pages/projects.vue:99` describes each project through commits, tests and coverage before it
says what the project is for. Those are useful IDP features, but none answers a new visitor's first
questions: what this is, what it produces, how the parts relate and where to start.

The two-persona framing is itself too narrow. A contributor, an engineer evaluating the code, a
recruiter and somebody curious about the visible products do not divide cleanly into developer and
non-developer. What does divide cleanly is intent: **explore what exists, understand how it works,
or contribute to it**.

## Result

**The portal stays one public, read-only application and adopts progressive disclosure around those
three intents.** It does not ask for a persona on launch, fork its routes, hide content behind a
mode or maintain two navigation trees. The public story becomes the front door; the current IDP
surfaces remain the deeper engineering layer.

The site remains derived wherever the source already exists. The root and project README opening
paragraphs supply plain-language descriptions through Nuxt Content, the Nx graph supplies the
catalog and relationships, and the existing snapshot supplies health. The redesign must not add a
second hand-written project catalog.

Each row is one implementation change. Line numbers are as of this report.

| Order | Where | Current mismatch | Change |
| --- | --- | --- | --- |
| 1 | `app/pages/index.vue:35-237` | Overview is an operator dashboard: health counters, repository findings, open issues and reviews | Replace the page hierarchy with a short repository introduction, three links labelled **Explore what exists**, **Understand how it works** and **Run or contribute**, then featured app/project cards. Move the existing health summary below those sections under **Engineering health**; keep findings reachable without making them the introduction |
| 2 | `app/layouts/default.vue:12-43` | Eleven destinations are split into two unlabeled groups and every technical surface appears primary | Group links as **Explore** (`Overview`, `Projects`, `What's new`), **Build** (`Documentation`, `Architecture`, `Decisions`) and **Engineering health** (`Issues`, `Coverage`, `Dependencies`, `Reviews`, `Scorecards`). Keep all routes and badges; change labels and order, not capabilities |
| 3 | `app/pages/projects.vue:80-147` | Cards lead with package names, filesystem paths, activity and test metrics | Query each project's README from the existing `docs` collection and lead with its title and generated description. Show area/maturity language derived from the project root and tags, its relationships, live site and docs before placing commits, tests and coverage in a secondary details block |
| 4 | `app/pages/graph.vue:38-119` | The first architecture explanation is Nx's embedded graph, followed by tags and edges | Add a plain-language **How the pieces fit** view before the raw graph. Derive its groups and edges from `ProjectNode.root`, `tags`, `dependsOn` and `dependedOnBy`; retain the Nx embed as **Detailed Nx graph**, not as the default explanation |
| 5 | `app/pages/docs/index.vue:14-35,59-85` | "Start here" is one developer-only sequence ending in clone setup | Replace `START` with the same three intent paths. **Explore** links to the root overview and project catalog, **Understand** to boundaries and the architecture view, and **Contribute** to `docs/guides/first-hour.md`; the complete wiki and recent changes stay below |
| 6 | `app/pages/issues.vue:35,88-98` and `app/pages/changelog.vue:47-59` | "Issues" and "Changelog" expose implementation vocabulary before visitor meaning | Present the existing routes as **Work in progress** and **What's new** in navigation and page headings. Keep the live GitHub issue list and generated changelogs unchanged beneath a one-paragraph explanation |
| 7 | `app/pages/decisions/index.vue:36-140`, `app/pages/scorecards.vue:18-111` and `app/pages/reviews/[[id]].vue:20-103` | Governance records assume readers already know why they matter | Add one short introduction per surface: decisions explain why the repository works this way; reviews and scorecards explain that they are transparent, dated assessments rather than live product ratings |
| 8 | `nuxt.config.ts:75-79` | The public overview is titled "Developer Portal" and explicitly emits `robots: noindex` | Remove `noindex`. Apply the name chosen in the open questions to the document title and sidebar at `app/layouts/default.vue:77-90`; the package and route names stay unchanged |
| 9 | `apps/developer-portal/README.md:3-13,36-42,88-119,163-180` | The app is documented only as an internal DX tool | Describe the public-front-door responsibility, the intent-led navigation and the rule that project summaries come from existing READMEs; keep the static, read-only IDP constraints intact |

The presentation does not need a separate glossary in its first pass. Interface copy should use
"applications", "shared building blocks" and "repository tooling" before exposing Nx tags, TMS,
CMS or invariant terminology. The technical terms still belong on the pages that explain them.

## Options considered

| Option | Why not |
| --- | --- |
| Ask "developer or regular person?" on launch | It makes a visitor classify themselves before the value of either choice is clear, developers can still be exploring rather than contributing, and two remembered modes make links and support harder to reason about |
| Build separate public and developer sites | Both would render the same projects, docs and architecture with different hand-kept navigation. The static deployment stays simple precisely because one artifact carries the repository |
| Keep the current dashboard and add an `/about` page | The root route and global navigation still teach every first-time visitor that repository health is the product; an optional explanation cannot repair the first impression |
| Hide engineering-health pages from public visitors | Coverage, dependencies, decisions and reviews are useful open-source transparency. They need lower prominence and context, not secrecy |
| Replace the portal with a full IDP framework | [`0016-developer-portal-self-service.md`](./0016-developer-portal-self-service.md) already found that Backstage adds maintained catalog state, a server and dependencies without replacing this workspace's collectors; #144 changes presentation, not that result |
| Hand-write marketing copy and project metadata inside the portal | The project READMEs already state purpose and the Nx graph already states membership and relationships. A portal-owned catalog would be another answer free to drift |

## Consequences

The app becomes a repository atlas first and an engineering cockpit second. Developers lose no
feature or direct URL; new visitors no longer have to understand coverage, advisories or scorecards
before discovering the products. Static hosting, anonymous access and the read-only boundary from
[`0016`](./0016-developer-portal-self-service.md) do not change.

**Implementation order.** Do rows 1–5 together because the same three intents must use the same
labels and destinations everywhere. Do rows 6–7 next as copy-only reframing, then row 8 once the
name is answered, and row 9 last so the README describes the interface that actually landed. The
project-card query in row 3 comes before prose is added anywhere else: if Nuxt Content's generated
`description` is insufficient, that is evidence to improve the source README, not permission to add
portal metadata.

**Tripwires an implementer will hit.**

- `content.config.ts` reads markdown outside the app and the production input in `package.json`
  deliberately hashes the whole workspace. Use that collection for descriptions; do not copy text
  into a TypeScript catalog.
- The deployed artifact sits under a repository base path. New links use Nuxt routes or
  `embedUrl()`; a root-relative public asset bypasses the base handling.
- The public site is a snapshot of `master`. "Live" belongs only on issues and deployment state,
  which already fetch in the browser; do not describe coverage, docs or scorecards as live.
- The raw graph is vendored output. Do not modify the files under `public/embed/graph/`; build the
  plain-language view from the collected `ProjectNode` data in `app/pages/graph.vue`.
- A project description is allowed to be absent. Render a neutral fallback rather than turning an
  empty README description into a build failure.
- Changes to `*.spec.ts` follow the `writing-tests` skill, and the finished public-surface change
  needs the `doc-drift-check` skill before row 9 is considered complete.
- Do not add analytics to validate this redesign. It would introduce a public tracking decision,
  an external service and consent questions that #144 did not ask.

The implementation still has four product questions. None blocks rows 1–7:

| Open question | Default if unanswered | What the answer changes |
| --- | --- | --- |
| What public name replaces **Developer Portal**: **Monorepo**, **Project Hub**, **Repository Atlas**, or another name? | **Monorepo** | `nuxt.config.ts` title, sidebar brand and homepage heading only; package name and URLs remain stable |
| Should **Engineering health** be always visible in the desktop sidebar or collapsed by default? | Visible as the last group | Navigation presentation only; every route remains directly addressable |
| Should the public introduction name the owner and personal-project nature explicitly? | Reuse the root README's neutral "personal projects" framing without an owner profile | Homepage copy; no collector or route change |
| Is English the intended public language, or is a Spanish overview required? | English only, matching the repository docs | A second language would require deciding whether only curated overview copy or the complete wiki is translated; it is not a string-copy task |

Revisit persona-specific modes only if the same page eventually needs contradictory content or
permissions for different authenticated users. The public, read-only site has neither today.

## Confirmation

| Claim | Check |
| --- | --- |
| The first screen explains the repository before its health | `rg -n "Explore what exists|Understand how it works|Run or contribute|Engineering health" apps/developer-portal/app/pages/index.vue` returns the four sections in that order |
| Navigation exposes one grouped information architecture | `rg -n "Explore|Build|Engineering health" apps/developer-portal/app/layouts/default.vue` returns all three group labels, with no persona-mode state or local storage |
| Project purpose is sourced rather than copied | `rg -n "queryCollection\(\"docs\"\)|description" apps/developer-portal/app/pages/projects.vue` finds the README query, and no new portal-owned project catalog file exists |
| The accessible architecture precedes the expert graph | `rg -n "How the pieces fit|Detailed Nx graph" apps/developer-portal/app/pages/graph.vue` returns the two headings in that order |
| Public indexing is no longer explicitly blocked | `rg -n "noindex" apps/developer-portal` returns no hit outside historical decision reports |
| Existing routes and static hosting still work | `pnpm exec nx build-static @monorepo/developer-portal` prerenders `/`, `/projects`, `/graph`, `/docs`, `/issues`, `/changelog`, `/coverage`, `/deps`, `/reviews` and `/scorecards` |
| The app remains valid | `pnpm exec nx run-many -t lint typecheck test --projects=@monorepo/developer-portal` passes |
| The public-surface documentation agrees with the implementation | Run the `doc-drift-check` skill against `apps/developer-portal/README.md`, then `pnpm docs:map --check` |
