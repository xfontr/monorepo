import { fakeAuthor, faker } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import AuthorCard from "./AuthorCard.vue";

const global = { mocks: { $t: (key: string, params?: Record<string, unknown>) => `t(${key}${params ? `, ${JSON.stringify(params)}` : ""})` } };

const AUTHOR = fakeAuthor({ name: "María José de la Vega", bio: faker.lorem.sentence() });

describe("author card", () => {
    it("labels the section with the author's name", async () => {
        const wrapper = await mountSuspended(AuthorCard, { props: { author: AUTHOR, to: "/autores/maria" }, global });

        const heading = wrapper.find("h2");

        expect(heading.text()).toBe(AUTHOR.name);
        expect(wrapper.find("section").attributes("aria-labelledby")).toBe(heading.attributes("id"));
    });

    it("hides the initials from assistive tech, since the name follows them", async () => {
        const wrapper = await mountSuspended(AuthorCard, { props: { author: AUTHOR, to: "/autores/maria" }, global });

        expect(wrapper.find("[aria-hidden=true]").text()).toBe("MJ");
    });

    it("counts the author's publications with the count as the plural", async () => {
        const wrapper = await mountSuspended(AuthorCard, { props: { author: AUTHOR, to: "/autores/maria", count: 7 }, global });

        const link = wrapper.find("a");

        expect(link.attributes("href")).toBe("/autores/maria");
        expect(link.text()).toBe("t(authorCard.profileCount, {\"count\":7})");
    });

    it("still links to the profile when the count isn't known", async () => {
        const wrapper = await mountSuspended(AuthorCard, { props: { author: AUTHOR, to: "/autores/maria" }, global });

        expect(wrapper.find("a").text()).toBe("t(authorCard.profile)");
    });

    // 9 of 42 authors have no bio
    it("leaves out the bio paragraph for an author without one", async () => {
        const wrapper = await mountSuspended(AuthorCard, { props: { author: { ...AUTHOR, bio: undefined }, to: "/autores/maria" }, global });

        expect(wrapper.text()).not.toContain(AUTHOR.bio!);
        expect(wrapper.findAll("p")).toHaveLength(1);
    });
});
