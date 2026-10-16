import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ArchiveSubjects from "./Subjects.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const CIVIL = { id: "1", slug: "derecho-civil", name: "Derecho civil" };
const PENAL = { id: "2", slug: "derecho-penal", name: "Derecho penal" };

const props = {
    title: "Materias",
    subjects: [
        { value: CIVIL, count: 3 },
        { value: PENAL, count: 1 },
    ],
};

describe("archive subjects", () => {
    it("links every subject to its own listing", async () => {
        const wrapper = await mountSuspended(ArchiveSubjects, { props, global });

        expect(wrapper.findAll("li a").map((link) => link.attributes("href"))).toEqual([
            "/materias/derecho-civil/",
            "/materias/derecho-penal/",
        ]);
    });

    it("hides each count from screen readers behind a worded one, so a bare number is never read out", async () => {
        const wrapper = await mountSuspended(ArchiveSubjects, { props, global });
        const link = wrapper.find("li a");

        expect(link.find("[aria-hidden='true']").text()).toBe("3");
        expect(link.find(".sr-only").text()).toBe("t(archiveSubjects.count)");
    });

    it("leaves the page's own subject out", async () => {
        const wrapper = await mountSuspended(ArchiveSubjects, {
            props: { ...props, currentSubject: CIVIL.id },
            global,
        });

        expect(wrapper.findAll("li").map((item) => item.text())).toEqual([
            expect.stringContaining("Derecho penal"),
        ]);
    });

    it("links back to the whole archive only when asked", async () => {
        const bare = await mountSuspended(ArchiveSubjects, { props, global });
        const linked = await mountSuspended(ArchiveSubjects, {
            props: { ...props, archiveLink: true },
            global,
        });

        expect(bare.find("aside > a").exists()).toBe(false);
        expect(linked.find("aside > a").attributes("href")).toBe("/publicaciones/");
    });
});
