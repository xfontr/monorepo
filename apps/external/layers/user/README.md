# 👤 user

The current user: who they are, what role they have, and what the UI is allowed to show them.
A [Nuxt layer](https://nuxt.com/docs/getting-started/layers) inside
[`@monorepo/external`](../../README.md), auto-registered by being in `layers/`.

## 🗂 What's in it

```
app/
├── types/              User, UserRole, UserRepository — the shapes and the port
├── repositories/       ApiUserRepository — the port's implementation
├── UserService.ts      fetches the user through whatever repository it's given
├── stores/user.ts      the Pinia store that holds the result
├── composables/flags.ts  role → feature flags
└── components/User.vue
```

The repository is a **port**: `UserService` takes one in its constructor and only ever calls
`get()`, so where the user actually comes from is decided in one place (the store) and can change
without touching anything downstream.

## 🚩 Feature flags

`useFlags()` is the only thing components should read. It turns the user's role into named booleans,
so a component asks "may I show this?" rather than "is this user an admin?" — the role check stays
in one file when the rules get more interesting.

```ts
const flags = useFlags();
// flags.value.showAdvancedOptions
// flags.value.showMoreInstructions
```

Roles are `normal | advanced | admin`.

## ⚠️ Still a stub

`ApiUserRepository` returns a hard-coded user with an empty id, name and email, and the role
`advanced` — there is no API behind it yet. Everything above it (the service, the store, the flags)
is real and won't need to change when there is; swapping the repository is the whole job.

Two loose ends worth knowing before you build on this:

- `UserService.ts` exports a class named `UserAdapter`. Same thing, two names.
- The store's `init()` must be called before `user` is populated; nothing calls it yet.
