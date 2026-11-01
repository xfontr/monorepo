import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

const head = vi.hoisted(() => ({
    template: undefined as unknown as (title: string) => string | null,
}));

mockNuxtImport("useHead", () => (input: { titleTemplate: (title: string) => string | null }) => {
    head.template = input.titleTemplate;
});

beforeEach(() => {
    head.template = undefined as unknown as typeof head.template;
});

describe("useSeoTitleTemplate", () => {
    it("leaves a title the CMS wrote as it is, since Yoast already ends it with the site's name", () => {
        useSeoTitleTemplate(() => "La culpa - Huella Legal");

        expect(head.template("La culpa - Huella Legal")).toBe("La culpa - Huella Legal");
    });

    it("signs a title the app made up, with the site's own template", () => {
        useSeoTitleTemplate(() => undefined);

        expect(head.template("La culpa")).toBe("La culpa %separator %siteName");
    });

    it("follows the CMS's title as it loads", () => {
        const cms: { title?: string } = {};
        useSeoTitleTemplate(() => cms.title);

        expect(head.template("La culpa")).toBe("La culpa %separator %siteName");

        cms.title = "La culpa - Huella Legal";

        expect(head.template("La culpa")).toBe("La culpa");
    });
});
