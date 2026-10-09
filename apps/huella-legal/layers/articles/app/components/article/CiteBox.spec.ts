import type { VueWrapper } from "@vue/test-utils";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import ArticleCiteBox from "./CiteBox.vue";

const toast = vi.hoisted(() => ({ add: vi.fn() }));

mockNuxtImport("useToast", () => () => toast);

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const CITATIONS = [
    { style: "APA 7", text: "Gil, M. (2024, 12 de marzo). La acción. Huella Legal." },
    { style: "Huella Legal", text: "GIL, M., «La acción», Huella Legal, 12 de marzo de 2024." },
];

const clipboard = { write: vi.fn() };

class ClipboardItem {
    constructor(readonly items: Record<string, string>) {}
}

// happy-dom defines clipboard on Navigator.prototype, and useClipboard checks `"clipboard" in navigator`.
function withoutClipboard(): void {
    const prototype = Object.getPrototypeOf(navigator);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "clipboard")!;

    Reflect.deleteProperty(navigator, "clipboard");
    Reflect.deleteProperty(prototype, "clipboard");
    onTestFinished(() => Object.defineProperty(prototype, "clipboard", descriptor));
}

beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true });
    vi.stubGlobal("ClipboardItem", ClipboardItem);
});

afterEach(() => {
    Reflect.deleteProperty(navigator, "clipboard");
    vi.unstubAllGlobals();
});

async function selectTab(wrapper: VueWrapper, index: number) {
    await wrapper.findAll("[role=tab]")[index]!.trigger("mousedown", { button: 0 });
}

describe("cite box", () => {
    it("shows the first style until another tab is picked", async () => {
        const wrapper = await mountSuspended(ArticleCiteBox, { props: { citations: CITATIONS }, global });

        expect(wrapper.text()).toContain(CITATIONS[0]!.text);

        await selectTab(wrapper, 1);

        expect(wrapper.text()).toContain(CITATIONS[1]!.text);
        expect(wrapper.text()).not.toContain(CITATIONS[0]!.text);
    });

    it("copies the style on screen, not the first one", async () => {
        const wrapper = await mountSuspended(ArticleCiteBox, { props: { citations: CITATIONS }, global });

        await selectTab(wrapper, 1);
        await wrapper.find("button:not([role=tab])").trigger("click");

        expect(clipboard.write).toHaveBeenCalledWith([new ClipboardItem({ "text/plain": CITATIONS[1]!.text })]);
    });

    it("confirms the copy in a toast, since the button itself doesn't change", async () => {
        const wrapper = await mountSuspended(ArticleCiteBox, { props: { citations: CITATIONS }, global });

        await wrapper.find("button:not([role=tab])").trigger("click");

        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "citeBox.copied" }));
    });

    it("puts the citation in the panel its tab controls, so aria-controls never dangles", async () => {
        const wrapper = await mountSuspended(ArticleCiteBox, { props: { citations: CITATIONS }, global, attachTo: document.body });

        const controls = wrapper.find("[role=tab][aria-selected=true]").attributes("aria-controls");

        expect(document.getElementById(controls!)?.textContent).toContain(CITATIONS[0]!.text);

        wrapper.unmount();
    });

    it("keeps the tab's aria-controls a single id when a style name has a space", async () => {
        const wrapper = await mountSuspended(ArticleCiteBox, { props: { citations: CITATIONS }, global });

        expect(wrapper.find("[role=tab][aria-selected=true]").attributes("aria-controls")).not.toMatch(/\s/);
    });

    it("hides the copy button where the browser has no clipboard, rather than offering a dead one", async () => {
        withoutClipboard();
        const wrapper = await mountSuspended(ArticleCiteBox, { props: { citations: CITATIONS }, global });

        expect(wrapper.find("button:not([role=tab])").exists()).toBe(false);
    });

    it("shows no tabs for a single style", async () => {
        const wrapper = await mountSuspended(ArticleCiteBox, { props: { citations: [CITATIONS[0]!] }, global });

        expect(wrapper.find("[role=tablist]").exists()).toBe(false);
        expect(wrapper.text()).toContain(CITATIONS[0]!.text);
    });

    it("renders nothing with no citation to show", async () => {
        const wrapper = await mountSuspended(ArticleCiteBox, { props: { citations: [] }, global });

        expect(wrapper.find("section").exists()).toBe(false);
    });
});
