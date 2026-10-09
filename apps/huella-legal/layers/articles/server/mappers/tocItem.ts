import type { Root } from "hast";
import type { TocItem } from "../../shared/types/TocItem";
import { eachElement, slugify, textContent } from "../utils/hast";

export function annotateHeadings(tree: Root): TocItem[] {
    const toc: TocItem[] = [];
    const used = new Set<string>();

    eachElement(tree, (element) => {
        if (element.tagName !== "h2" && element.tagName !== "h3") return;

        const label = textContent(element);

        if (!label) return;

        const { id } = element.properties;
        const base = typeof id === "string" && id ? id : slugify(label) || "seccion";
        let anchor = base;

        for (let suffix = 2; used.has(anchor); suffix++) anchor = `${base}-${suffix}`;

        used.add(anchor);
        element.properties.id = anchor;
        toc.push({ id: anchor, label, level: element.tagName === "h2" ? 2 : 3 });
    });

    return toc;
}
