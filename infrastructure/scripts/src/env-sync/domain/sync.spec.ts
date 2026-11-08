import { describe, expect, it } from "vitest";
import { parseEnv, render, type EnvLine } from "./envFile.ts";
import { describeSync, lostData, syncEnv, TRAILING_HEADER } from "./sync.ts";

const EXAMPLE = `# CONTENT — the site root
CONTENT_URL=

# MAIL
MAIL_KEY=
MAIL_PORT=587

# OVERRIDES — uncomment only to replace
# SITE_URL=
`;

const lines = (text: string): EnvLine[] => {
    const parsed = parseEnv(text);
    if (parsed.problem !== undefined) throw new Error(parsed.problem);
    return parsed.lines;
};

const sync = (env: string | null): string =>
    render(syncEnv(lines(EXAMPLE), env === null ? [] : lines(env)).lines);

describe("syncEnv", () => {
    it("creates an env file identical to the example when there is none", () => {
        expect(sync(null)).toBe(EXAMPLE);
    });

    it("adds a new key at the example's position with the example's default, keeping every value", () => {
        expect(sync("CONTENT_URL=https://cms\nMAIL_KEY=secret\n")).toBe(
            EXAMPLE.replace("CONTENT_URL=\n", "CONTENT_URL=https://cms\n").replace(
                "MAIL_KEY=\n",
                "MAIL_KEY=secret\n",
            ),
        );
    });

    it("reorders a hand-kept file and replaces its prose comments with the example's", () => {
        const synced = syncEnv(
            lines(EXAMPLE),
            lines("# my notes\nMAIL_PORT=25\nMAIL_KEY=k\nCONTENT_URL=u\n"),
        );

        expect(render(synced.lines)).toBe(
            EXAMPLE.replace("CONTENT_URL=\n", "CONTENT_URL=u\n")
                .replace("MAIL_KEY=\n", "MAIL_KEY=k\n")
                .replace("MAIL_PORT=587", "MAIL_PORT=25"),
        );
        expect(synced.droppedComments).toBe(1);
    });

    it("puts a set override in the example's commented slot instead of the trailing block", () => {
        expect(sync("SITE_URL=https://staging\n")).toContain(
            "# OVERRIDES — uncomment only to replace\nSITE_URL=https://staging\n",
        );
    });

    it("keeps a commented-out old value above its key, since it's data the example doesn't have", () => {
        expect(sync("# MAIL_KEY=old\nMAIL_KEY=new\n")).toContain(
            "# MAIL\n# MAIL_KEY=old\nMAIL_KEY=new\n",
        );
    });

    it("moves keys the example doesn't know into a trailing block in their original order", () => {
        const synced = syncEnv(lines(EXAMPLE), lines("ZED=1\nMAIL_KEY=k\n# OLD=x\nALPHA=2\n"));

        expect(
            render(synced.lines).endsWith(`\n\n${TRAILING_HEADER}\nZED=1\n# OLD=x\nALPHA=2\n`),
        ).toBe(true);
        expect(synced.trailing).toStrictEqual(["ZED", "ALPHA"]);
    });

    it("is idempotent, so a second run never rewrites the file or re-counts its own header", () => {
        const once = sync("ZED=1\n# my notes\nMAIL_KEY=k\n");
        const twice = syncEnv(lines(EXAMPLE), lines(once));

        expect(render(twice.lines)).toBe(once);
        expect(twice.droppedComments).toBe(0);
    });

    it("keeps a multi-line value whole when moving it", () => {
        expect(sync('MAIL_PORT=1\nMAIL_KEY="a\nb"\n')).toContain('MAIL_KEY="a\nb"\nMAIL_PORT=1\n');
    });
});

describe("lostData", () => {
    const env = lines("MAIL_KEY=secret\n# OLD=x\n");

    it("passes a result that kept every value and commented assignment", () => {
        expect(
            lostData(env, lines(EXAMPLE), render(syncEnv(lines(EXAMPLE), env).lines)),
        ).toStrictEqual([]);
    });

    it("catches a changed value, a lost commented line and a still-missing key", () => {
        expect(lostData(env, lines(EXAMPLE), "MAIL_KEY=other\n")).toStrictEqual([
            "MAIL_KEY would change or disappear",
            "a commented OLD would go",
            "CONTENT_URL would still be missing",
            "MAIL_PORT would still be missing",
        ]);
    });
});

describe("describeSync", () => {
    it("names keys and counts but never a value", () => {
        const synced = syncEnv(lines(EXAMPLE), lines("# note\nEXTRA=hunter2\n"));

        expect(describeSync(synced)).toBe(
            'added CONTENT_URL, MAIL_KEY, MAIL_PORT; kept EXTRA under "# Not in .env.example"; dropped 1 comment line not in the example',
        );
    });
});
