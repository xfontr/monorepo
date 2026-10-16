import type { VueWrapper } from "@vue/test-utils";
import { fakeAuthor } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ArchiveAuthor from "./Author.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const AUTHOR = fakeAuthor({ name: "María Ruiz" });

const stats = (wrapper: VueWrapper) =>
    wrapper.findAll("dl > div").map((stat) => [stat.find("dt").text(), stat.find("dd").text()]);

describe("archive author", () => {
    it("titles the profile with the author's name and leads with their bio", async () => {
        const wrapper = await mountSuspended(ArchiveAuthor, {
            props: { author: { ...AUTHOR, bio: "Doctoranda en Derecho penal." }, total: 4 },
            global,
        });

        expect(wrapper.find("h1").text()).toBe("María Ruiz");
        expect(wrapper.find("h1 + p").text()).toBe("Doctoranda en Derecho penal.");
    });

    it("gives the year of their first post in Madrid, so a New Year's Eve post counts as the next", async () => {
        const wrapper = await mountSuspended(ArchiveAuthor, {
            props: { author: AUTHOR, total: 4, since: "2021-12-31T23:30:00Z" },
            global,
        });

        expect(stats(wrapper)).toEqual([
            ["archiveAuthor.stats.publications", "4"],
            ["archiveAuthor.stats.since", "2022"],
        ]);
    });

    it("drops the since stat when no post carries a date", async () => {
        const wrapper = await mountSuspended(ArchiveAuthor, {
            props: { author: AUTHOR, total: 4 },
            global,
        });

        expect(stats(wrapper)).toEqual([["archiveAuthor.stats.publications", "4"]]);
    });
});
