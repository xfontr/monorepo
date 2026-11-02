/** A rule said no; the message is shown to the user as-is. */
export class Refusal extends Error {}

/** Checked on use rather than at build, since CI builds the app with no env at all. */
export const requireEnv = (name: string, value: string | undefined): string => {
    if (!value) throw new Refusal(`${name} is not set; see apps/wp-editor/.env.example.`);

    return value;
};
