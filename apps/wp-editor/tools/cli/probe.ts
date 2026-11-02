import type { WordPress } from "../../server/adapters/wordpress.ts";

const PROBE_HTML =
    '<div class="wp-editor-probe"><style>.wp-editor-probe{color:red}</style><p>probe</p></div>';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const kind = (raw: string) => {
    if (raw.includes("<!-- wp:")) return "block";

    return /<p[\s>]/.test(raw) ? "classic, with <p>" : "classic, no <p> (needs autop)";
};

/** Step 0 of the editor's README: the three facts the build depends on, printed for the README. */
export const probe = async (wp: WordPress, print: (line: string) => void): Promise<void> => {
    const posts = (await wp.list("posts")).slice(0, 3);

    print("1. Content format");
    for (const { id, content } of posts) print(`   posts-${id}: ${kind(content.raw)}`);

    print("2. Revisions");
    try {
        const revisions = await wp.revisions("posts", posts[0]!.id);
        print(`   posts-${posts[0]!.id}: ${revisions.length} revisions`);
    } catch (error) {
        print(`   unavailable: ${(error as Error).message}`);
    }

    print("3. Draft round-trip");
    const draft = await wp.create("posts", {
        title: "wp-editor probe",
        status: "draft",
        content: PROBE_HTML,
    });

    try {
        const read = await wp.get("posts", draft.id);
        print(`   class kept: ${read.content.raw.includes('class="wp-editor-probe"')}`);
        print(`   <style> kept (unfiltered_html): ${read.content.raw.includes("<style>")}`);

        // `modified_gmt` has one-second resolution, so a write inside the same second can't move it.
        await sleep(1100);
        const written = await wp.update("posts", draft.id, { content: `${PROBE_HTML}<p>2</p>` });
        print(`   modified_gmt moves on PUT: ${written.modified_gmt !== read.modified_gmt}`);
    } finally {
        await wp.remove("posts", draft.id);
        print(`   draft posts-${draft.id} deleted`);
    }
};
