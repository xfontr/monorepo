import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import NoResults from "./NoResults.vue";

// `<i18n-t>` reads the real i18n instance rather than a `$t` mock, so the spec feeds it messages
const MESSAGES = {
    noResults: {
        broaden: "broaden",
        browse: "browse",
        title: "title: {query}",
    },
};

const SUBJECTS = [{ label: "Derecho penal", to: "/materias/penal" }, { label: "Derecho civil", to: "/materias/civil" }];

describe("no results", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("repeats the query in the heading, so the reader sees what was searched", async () => {
        const wrapper = await mountSuspended(NoResults, { props: { query: "kardashov", subjects: SUBJECTS } });

        expect(wrapper.find("h2").text()).toBe("title: kardashov");
    });

    it("names its region by that heading, so the landmark says what was searched too", async () => {
        const wrapper = await mountSuspended(NoResults, { props: { query: "kardashov", subjects: SUBJECTS } });

        const labelledBy = wrapper.find("section").attributes("aria-labelledby");

        expect(wrapper.find(`h2 [id="${labelledBy}"]`).text()).toBe("title: kardashov");
    });

    it("suggests broadening the search, since the query matched nothing", async () => {
        const wrapper = await mountSuspended(NoResults, { props: { query: "kardashov", subjects: SUBJECTS } });

        expect(wrapper.find("[data-slot=description]").text()).toBe("broaden");
    });

    it("offers the subjects as a way out, and leaves the row out when there are none", async () => {
        const withSubjects = await mountSuspended(NoResults, { props: { query: "kardashov", subjects: SUBJECTS } });
        const without = await mountSuspended(NoResults, { props: { query: "kardashov", subjects: [] } });

        expect(withSubjects.findAll("a").map((link) => link.attributes("href"))).toEqual(["/materias/penal", "/materias/civil"]);
        expect(without.text()).not.toContain("browse");
    });
});
