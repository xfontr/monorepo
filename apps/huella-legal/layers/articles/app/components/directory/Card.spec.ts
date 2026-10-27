import { fakeAsset, fakeAuthor, faker } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import DirectoryCard from "./Card.vue";

const global = {
    mocks: {
        $t: (key: string, named?: Record<string, unknown>) => `t(${key}, ${named?.count})`,
    },
};

const AUTHOR = fakeAuthor({ name: "María José Fernández", slug: "maria-jose-fernandez" });

describe("directory card", () => {
    it("links the author's name to their profile", async () => {
        const wrapper = await mountSuspended(DirectoryCard, {
            props: { author: AUTHOR, count: 3 },
            global,
        });

        expect(wrapper.find("a").attributes()).toMatchObject({
            href: "/colaboradores/maria-jose-fernandez/",
            "aria-label": "María José Fernández",
        });
    });

    it("words the publication count", async () => {
        const wrapper = await mountSuspended(DirectoryCard, {
            props: { author: AUTHOR, count: 3 },
            global,
        });

        expect(wrapper.text()).toContain("t(directoryCard.count, 3)");
    });

    it("falls back to the initials without an avatar, and shows the avatar when there is one", async () => {
        const bare = await mountSuspended(DirectoryCard, {
            props: { author: { ...AUTHOR, avatar: undefined }, count: 1 },
            global,
        });
        const avatar = fakeAsset();
        const pictured = await mountSuspended(DirectoryCard, {
            props: { author: { ...AUTHOR, avatar }, count: 1 },
            global,
        });

        expect(bare.text()).toContain("MJ");
        expect(pictured.find("img").attributes("src")).toBe(avatar.url);
    });

    it("renders the bio only for an author who has one", async () => {
        const bio = faker.lorem.sentence();
        const withBio = await mountSuspended(DirectoryCard, {
            props: { author: { ...AUTHOR, bio }, count: 1 },
            global,
        });
        const withoutBio = await mountSuspended(DirectoryCard, {
            props: { author: { ...AUTHOR, bio: undefined }, count: 1 },
            global,
        });

        expect(withBio.text()).toContain(bio);
        expect(withoutBio.find("[data-slot='description']").exists()).toBe(false);
    });
});
