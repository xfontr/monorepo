import type { VueWrapper } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ArticleToc from "./ArticleToc.vue";

const observers: { callback: IntersectionObserverCallback }[] = [];

class FakeObserver {
    observe = vi.fn();
    disconnect = vi.fn();

    constructor(public callback: IntersectionObserverCallback) {
        observers.push(this);
    }
}

function show(...ids: string[]): void {
    const entries = ids.map((id) => ({ target: document.getElementById(id), isIntersecting: true }));

    observers.at(-1)!.callback(entries as unknown as IntersectionObserverEntry[], {} as IntersectionObserver);
}

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const TOC = [
    { id: "introduccion", label: "Introducción", level: 2 },
    { id: "accion", label: "La acción", level: 2 },
    { id: "finalismo", label: "Finalismo", level: 3 },
    { id: "tipicidad", label: "Tipicidad", level: 2 },
] as const;

const items = [...TOC];

function rail(wrapper: VueWrapper) {
    return wrapper.findAll(".lg\\:block a");
}

beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("IntersectionObserver", FakeObserver);
});

afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
});

describe("article TOC", () => {
    it("lists sections only, each linking to its heading's anchor", async () => {
        const wrapper = await mountSuspended(ArticleToc, { props: { items }, global });

        expect(rail(wrapper).map((link) => [link.text(), link.attributes("href")])).toEqual([
            ["Introducción", "#introduccion"],
            ["La acción", "#accion"],
            ["Tipicidad", "#tipicidad"],
        ]);
    });

    it("lights the first section before any heading is reached", async () => {
        const wrapper = await mountSuspended(ArticleToc, { props: { items }, global });

        expect(wrapper.find("[aria-current=location]").text()).toBe("Introducción");
    });

    it("lights every section whose heading is on screen, and points aria-current at the first", async () => {
        document.body.innerHTML = TOC.map(({ id }) => `<h2 id="${id}"></h2>`).join("");
        const wrapper = await mountSuspended(ArticleToc, { props: { items }, global });

        show("accion", "tipicidad");
        await nextTick();

        expect(rail(wrapper).map((link) => link.attributes("data-lit"))).toEqual([undefined, "true", "true"]);
        expect(wrapper.find("[aria-current=location]").text()).toBe("La acción");
    });

    it("names the landmark, since a page can hold more than one nav", async () => {
        const wrapper = await mountSuspended(ArticleToc, { props: { items }, global });

        expect(wrapper.find("nav").attributes("aria-label")).toBe("t(articleToc.title)");
    });

    it("opens the small-screen accordion onto the same sections", async () => {
        const wrapper = await mountSuspended(ArticleToc, { props: { items }, global, attachTo: document.body });

        const trigger = wrapper.find("button[aria-expanded]");

        expect(trigger.text()).toContain("t(articleToc.title)");
        expect(trigger.attributes("aria-expanded")).toBe("false");

        await trigger.trigger("click");

        expect(trigger.attributes("aria-expanded")).toBe("true");
        expect(wrapper.findAll("[role=region] a").map((link) => link.attributes("href"))).toEqual(["#introduccion", "#accion", "#tipicidad"]);

        wrapper.unmount();
    });

    it("renders nothing for a body with no sections, rather than an empty box", async () => {
        const wrapper = await mountSuspended(ArticleToc, { props: { items: [{ id: "suelto", label: "Suelto", level: 3 }] }, global });

        expect(wrapper.find("nav").exists()).toBe(false);
    });
});
