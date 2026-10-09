import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import ArticleShareBar from "./ShareBar.vue";

const toast = vi.hoisted(() => ({ add: vi.fn() }));

mockNuxtImport("useToast", () => () => toast);

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const PROPS = { title: "La acción", url: "https://huella.test/la-accion" };

const browser = { share: vi.fn(), write: vi.fn(), print: vi.fn() };

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

function withShareSheet(share: typeof browser.share): void {
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
}

function button(wrapper: VueWrapper, key: string) {
    return wrapper.find(`button[aria-label="t(shareBar.${key})"]`);
}

beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", { value: { write: browser.write }, configurable: true });
    vi.stubGlobal("ClipboardItem", ClipboardItem);
    vi.stubGlobal("print", browser.print);
});

afterEach(() => {
    Reflect.deleteProperty(navigator, "share");
    Reflect.deleteProperty(navigator, "canShare");
    Reflect.deleteProperty(navigator, "clipboard");
    vi.unstubAllGlobals();
});

describe("share bar", () => {
    it("hands the given title and URL to the native share sheet, never the current location", async () => {
        withShareSheet(browser.share.mockResolvedValue(undefined));
        const wrapper = await mountSuspended(ArticleShareBar, { props: PROPS, global });

        await button(wrapper, "share").trigger("click");

        expect(browser.share).toHaveBeenCalledWith(PROPS);
        expect(browser.write).not.toHaveBeenCalled();
    });

    it("treats a dismissed share sheet as a choice, not an error", async () => {
        withShareSheet(browser.share.mockRejectedValue(new DOMException("", "AbortError")));
        const wrapper = await mountSuspended(ArticleShareBar, { props: PROPS, global });

        await button(wrapper, "share").trigger("click");
        await flushPromises();

        expect(browser.write).not.toHaveBeenCalled();
        expect(toast.add).not.toHaveBeenCalled();
    });

    it("copies the URL instead when the browser refuses the share sheet", async () => {
        withShareSheet(browser.share.mockRejectedValue(new DOMException("", "NotAllowedError")));
        const wrapper = await mountSuspended(ArticleShareBar, { props: PROPS, global });

        await button(wrapper, "share").trigger("click");
        await flushPromises();

        expect(browser.write).toHaveBeenCalled();
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "shareBar.linkCopied" }));
    });

    it("claims no copy when the share sheet fails and there is no clipboard to fall back on", async () => {
        withoutClipboard();
        withShareSheet(browser.share.mockRejectedValue(new DOMException("", "NotAllowedError")));
        const wrapper = await mountSuspended(ArticleShareBar, { props: PROPS, global });

        await button(wrapper, "share").trigger("click");
        await flushPromises();

        expect(toast.add).not.toHaveBeenCalled();
    });

    it("copies the URL where there is no share sheet, and confirms it in a toast", async () => {
        const wrapper = await mountSuspended(ArticleShareBar, { props: PROPS, global });

        await button(wrapper, "share").trigger("click");
        await flushPromises();

        expect(browser.write).toHaveBeenCalledWith([new ClipboardItem({ "text/plain": PROPS.url })]);
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "shareBar.linkCopied" }));
    });

    it("hides the share button where the browser can neither share nor copy", async () => {
        withoutClipboard();
        const wrapper = await mountSuspended(ArticleShareBar, { props: PROPS, global });

        expect(button(wrapper, "share").exists()).toBe(false);
    });

    it("prints the page", async () => {
        const wrapper = await mountSuspended(ArticleShareBar, { props: PROPS, global });

        await button(wrapper, "print").trigger("click");

        expect(browser.print).toHaveBeenCalled();
    });

    it("links to the citation only when the page has one", async () => {
        const without = await mountSuspended(ArticleShareBar, { props: PROPS, global });
        const withCite = await mountSuspended(ArticleShareBar, { props: { ...PROPS, citeTo: "#citar" }, global });

        expect(without.find("a").exists()).toBe(false);
        expect(withCite.find("a").attributes("href")).toBe("#citar");
        expect(withCite.find("a").text()).toBe("t(shareBar.cite)");
    });
});
