/**
 * Facts about how this repo is laid out, with no way to read the repo. Separate from
 * [`git.ts`](../adapters/git.ts) so a pure module can import them: `drift/detect.ts` needs `PROJECT_ROOTS`
 * and nothing else, and pulling it out of a module that shells out to `git` would drag a
 * subprocess into a file whose whole point is that it has no side effects.
 */

/** Every project in this repo lives directly under one of these three — see the `new-package` skill. */
export const PROJECT_ROOTS = ["packages", "apps", "infrastructure"];
