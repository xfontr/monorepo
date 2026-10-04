import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import NoResults from "./NoResults.vue";

// `<i18n-t>` reads the real i18n instance rather than a `$t` mock, so the spec feeds it messages
const MESSAGES = {
    noResults: {
        broaden: "broaden",
        browse: "browse",
        name: "name",
        spelling: "spelling: «{suggestion}»?",
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

    it("links the spelling suggestion inside its sentence", async () => {
        const wrapper = await mountSuspended(NoResults, {
            props: { query: "kardashov", subjects: [], suggestion: { label: "Kardashev", to: "/?q=kardashev" } },
        });

        const tip = wrapper.find("li");

        expect(tip.text()).toBe("spelling: «Kardashev»?");
        expect(tip.find("a").attributes("href")).toBe("/?q=kardashev");
    });

    it("drops the spelling tip when there is no suggestion, rather than inventing one", async () => {
        const wrapper = await mountSuspended(NoResults, { props: { query: "kardashov", subjects: SUBJECTS } });

        expect(wrapper.text()).not.toContain("spelling");
        expect(wrapper.find("ul").findAll("li")).toHaveLength(1);
    });

    it("offers the subjects as a way out, and leaves the row out when there are none", async () => {
        const withSubjects = await mountSuspended(NoResults, { props: { query: "kardashov", subjects: SUBJECTS } });
        const without = await mountSuspended(NoResults, { props: { query: "kardashov", subjects: [] } });

        expect(withSubjects.findAll("a").map((link) => link.attributes("href"))).toEqual(["/materias/penal", "/materias/civil"]);
        expect(without.text()).not.toContain("browse");
    });
});
