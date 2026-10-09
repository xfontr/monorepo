import { describe, expect, it } from "vitest";
import { parseFragment, stringifyNodes } from "../utils/hast";
import { annotateHeadings } from "./tocItem";

const annotate = (html: string) => {
    const tree = parseFragment(html);
    const toc = annotateHeadings(tree);

    return { toc, html: stringifyNodes(tree.children) };
};

describe("annotateHeadings", () => {
    it("gives each h2 and h3 an ASCII id and lists them in order", () => {
        const { toc, html } = annotate("<h2>Introducción</h2><h3>El tipo  <em>objetivo</em></h3>");

        expect(toc).toEqual([
            { id: "introduccion", label: "Introducción", level: 2 },
            { id: "el-tipo-objetivo", label: "El tipo objetivo", level: 3 },
        ]);
        expect(html).toContain('<h2 id="introduccion">');
    });

    // 13 posts already carry heading ids, and old deep links point at them
    it("keeps a heading's existing id", () => {
        expect(annotate('<h2 id="conclusiones-finales">Conclusiones</h2>').toc[0]?.id).toBe(
            "conclusiones-finales",
        );
    });

    it("never repeats an id", () => {
        expect(annotate("<h2>Dolo</h2><h2>Dolo</h2>").toc.map(({ id }) => id)).toEqual([
            "dolo",
            "dolo-2",
        ]);
    });

    it("leaves out h4 and deeper, and headings with no text", () => {
        expect(annotate("<h2> </h2><h4>Detalle</h4>").toc).toEqual([]);
    });

    it("falls back to a readable id for a heading with no letters", () => {
        expect(annotate("<h2>§</h2>").toc[0]?.id).toBe("seccion");
    });
});
