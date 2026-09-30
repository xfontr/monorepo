import { fakeAuthor } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import Byline from "./Byline.vue";

const global = { mocks: { $t: (key: string, params: Record<string, unknown>) => `t(${key}, ${JSON.stringify(params)})` } };

const ANA = { ...fakeAuthor({ name: "Ana de la Torre" }), to: "/autores/ana" };
const LUIS = fakeAuthor({ name: "Luis Martín" });
const MARTA = fakeAuthor({ name: "Marta Gil" });

describe("byline", () => {
    it("joins names the Spanish way, with commas and a final \"y\"", async () => {
        const wrapper = await mountSuspended(Byline, { props: { authors: [ANA, LUIS, MARTA] }, global });

        expect(wrapper.find("li").text()).toBe("Ana de la Torre, Luis Martín y Marta Gil");
    });

    it("links only the authors that have a profile to link to", async () => {
        const wrapper = await mountSuspended(Byline, { props: { authors: [ANA, LUIS] }, global });

        const links = wrapper.findAll("a");

        expect(links.map((link) => link.text())).toEqual(["Ana de la Torre"]);
        expect(links[0]?.attributes("href")).toBe("/autores/ana");
    });

    it("prints the date in Madrid, so a late-night post never shows the day before", async () => {
        const wrapper = await mountSuspended(Byline, { props: { authors: [LUIS], publishedAt: "2024-03-11T23:30:00Z" }, global });

        const time = wrapper.find("time");

        expect(time.text()).toBe("12 de marzo de 2024");
        expect(time.attributes("datetime")).toBe("2024-03-11T23:30:00Z");
    });

    it("takes the reading time from translations, with the minutes as the plural count", async () => {
        const wrapper = await mountSuspended(Byline, { props: { authors: [LUIS], readingMinutes: 7 }, global });

        expect(wrapper.text()).toContain("t(byline.readingTime, {\"minutes\":7})");
    });

    it("hides the avatar stack from assistive tech, since the names follow it", async () => {
        const wrapper = await mountSuspended(Byline, { props: { authors: [ANA, LUIS], avatars: true }, global });

        const stack = wrapper.find("[aria-hidden=true]");

        expect(stack.text()).toContain("AT");
        expect(stack.text()).toContain("LM");
    });

    it("draws no avatars unless asked", async () => {
        const wrapper = await mountSuspended(Byline, { props: { authors: [ANA] }, global });

        expect(wrapper.find("[aria-hidden=true]").exists()).toBe(false);
    });
});
