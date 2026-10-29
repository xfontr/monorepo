import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import SearchDialog from "./Dialog.vue";

mockNuxtImport("useSearchPreview", () => () => ({
    home: ref(undefined),
    search: ref(undefined),
    pending: ref(false),
}));

const mounted: { unmount: () => void }[] = [];

const mountDialog = async () => {
    const wrapper = await mountSuspended(SearchDialog, {
        route: "/",
        global: { mocks: { $t: (key: string) => `t(${key})` } },
    });

    mounted.push(wrapper);

    return wrapper;
};

const dialog = () =>
    vi.waitFor(() => {
        const found = document.body.querySelector("[role='dialog']");
        expect(found).not.toBeNull();
        return found!;
    });

afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
});

describe("search dialog", () => {
    it("is a link to the results page until hydration, so search works without JS", async () => {
        const wrapper = await mountDialog();

        expect(wrapper.find("a").attributes("href")).toBe("/buscar/");
    });

    it("opens in place instead of following the link once the page is live", async () => {
        const wrapper = await mountDialog();
        const before = wrapper.vm.$router.currentRoute.value.fullPath;

        await wrapper.find("a").trigger("click");

        expect((await dialog()).getAttribute("aria-labelledby")).not.toBeNull();
        expect(wrapper.vm.$router.currentRoute.value.fullPath).toBe(before);
    });

    it("opens from the / shortcut, the key readers bring from other sites", async () => {
        await mountDialog();

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "/", bubbles: true }));

        expect(await dialog()).toBeTruthy();
    });

    it("closes when the route changes, so a followed result is not hidden behind it", async () => {
        const wrapper = await mountDialog();
        await wrapper.find("a").trigger("click");
        await dialog();

        await wrapper.vm.$router.push("/buscar/?query=dolo");

        await vi.waitFor(() => expect(document.body.querySelector("[role='dialog']")).toBeNull());
    });
});
