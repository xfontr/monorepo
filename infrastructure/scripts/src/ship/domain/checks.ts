/** The exact message `gh pr checks` returns when no check has attached to the PR's head commit yet. */
export const isMissingChecksError = (text: string): boolean => /no checks reported/i.test(text);
