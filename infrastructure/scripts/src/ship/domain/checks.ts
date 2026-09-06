/**
 * `gh pr checks` errors immediately with this exact message when no check run has been attached to
 * the PR's head commit yet — the normal state for the few seconds right after a push, before GitHub
 * dispatches anything. Naming it here is what lets `watchChecks` retry past that registration lag
 * instead of reporting it as a failed check, same as every other way `gh pr checks --watch` can fail.
 */
export const isMissingChecksError = (text: string): boolean => /no checks reported/i.test(text);
