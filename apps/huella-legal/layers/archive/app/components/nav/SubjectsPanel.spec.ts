import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import NavSubjectsPanel from "./SubjectsPanel.vue";

const subject = (slug: string, count: number): Facet<Category> => ({
    value: { id: slug, slug, name: slug },
    count,
});

const SUBJECTS = [
    subject("abogacia", 3),
    subject("derecho-civil", 8),
    subject("derecho-penal", 12),
    subject("derecho-laboral", 2),
    subject("derecho-mercantil", 4),
    subject("derechos-fundamentales", 6),
    subject("teoria-del-derecho", 5),
    subject("derecho-procesal", 7),
    subject("derecho-administrativo", 1),
];

const fetching = vi.hoisted(() => ({
    home: undefined as Home | undefined,
    status: "success" as string,
}));

mockNuxtImport("useCachedFetch", () => () => ({
    data: ref(fetching.home),
    status: ref(fetching.status),
}));

const mountPanel = () =>
    mountSuspended(NavSubjectsPanel, {
        global: { mocks: { $t: (key: string) => `t(${key})` } },
    });

beforeEach(() => {
    fetching.home = {
        latest: [],
        recent: [],
        theses: [],
        subjects: SUBJECTS,
        formats: [],
    };
    fetching.status = "success";
});

describe("subjects panel", () => {
    it("lists the eight biggest areas, biggest first, then the whole index", async () => {
        const wrapper = await mountPanel();

        expect(wrapper.findAll("a").map((link) => link.attributes("href"))).toEqual([
            "/areas/derecho-penal/",
            "/areas/derecho-civil/",
            "/areas/derecho-procesal/",
            "/areas/derechos-fundamentales/",
            "/areas/teoria-del-derecho/",
            "/areas/derecho-mercantil/",
            "/areas/abogacia/",
            "/areas/derecho-laboral/",
            "/areas/",
        ]);
    });

    it("links the whole index while the areas load, so an open panel always leads somewhere", async () => {
        fetching.home = undefined;
        fetching.status = "pending";

        const wrapper = await mountPanel();

        expect(wrapper.findAll("a").map((link) => link.attributes("href"))).toEqual(["/areas/"]);
        expect(wrapper.text()).toContain("t(common.loading)");
    });
});
