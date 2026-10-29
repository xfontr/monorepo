import { fakeAuthor } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import DirectoryListing from "./Listing.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const ALVARO = { value: fakeAuthor({ name: "Álvaro Núñez" }), count: 9 };
const MARTA = { value: fakeAuthor({ name: "Marta Gil" }), count: 4 };

// Past the first twelve, so the rest wait behind the button
const OTHERS = Array.from({ length: 12 }, (_, index) => ({
    value: fakeAuthor({ name: `Autora ${index}` }),
    count: 1,
}));

const AUTHORS = [ALVARO, MARTA, ...OTHERS];

const mountListing = (authors = AUTHORS) =>
    mountSuspended(DirectoryListing, { props: { authors }, global, attachTo: document.body });

const names = (wrapper: Awaited<ReturnType<typeof mountListing>>) =>
    wrapper.findAll("h3").map((heading) => heading.text());

describe("directory listing", () => {
    it("shows the first twelve authors and offers the rest behind one button", async () => {
        const wrapper = await mountListing();

        expect(names(wrapper)).toHaveLength(12);
        expect(wrapper.find("button").text()).toBe("t(directoryListing.more)");
    });

    it("narrows by name with accents and case folded, searching past the first twelve", async () => {
        const wrapper = await mountListing();

        await wrapper.find("input").setValue("  ALVARO ");

        expect(names(wrapper)).toEqual(["Álvaro Núñez"]);
        expect(wrapper.find("[role='status']").text()).toBe("t(directoryListing.matches)");

        await wrapper.find("input").setValue("Autora 11");

        expect(names(wrapper)).toEqual(["Autora 11"]);
        expect(wrapper.find("button").exists()).toBe(false);
    });

    it("shows every match while a search is typed, even past the first twelve", async () => {
        const wrapper = await mountListing();

        await wrapper.find("input").setValue("a");

        expect(names(wrapper)).toHaveLength(AUTHORS.length);
        expect(wrapper.find("button").exists()).toBe(false);
    });

    it("keeps the status region silent until a search is typed", async () => {
        const wrapper = await mountListing();

        expect(wrapper.find("[role='status']").text()).toBe("");
    });

    it("answers a name nobody has with the no-match state, whose reset brings everyone back", async () => {
        const wrapper = await mountListing();
        const input = wrapper.find("input");

        await input.setValue("Zapatero");

        expect(wrapper.find("ul").exists()).toBe(false);
        expect(wrapper.text()).toContain("t(directoryListing.noMatch.title)");

        await wrapper
            .findAll("button")
            .find((button) => button.text() === "t(directoryListing.noMatch.reset)")!
            .trigger("click");

        expect((input.element as HTMLInputElement).value).toBe("");
        expect(names(wrapper)).toHaveLength(12);
        expect(document.activeElement).toBe(input.element);

        wrapper.unmount();
    });
});
