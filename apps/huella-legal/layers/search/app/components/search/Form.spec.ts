import { MAX_SEARCH_LENGTH } from "@monorepo/content";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SearchForm from "./Form.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

describe("search form", () => {
    it("submits as a GET to the search page under the name query, so it works before hydration", async () => {
        const wrapper = await mountSuspended(SearchForm, { props: { modelValue: "" }, global });

        const form = wrapper.find("form");

        expect([form.attributes("action"), form.attributes("method")]).toEqual(["/buscar/", "get"]);
        expect(wrapper.find("input").attributes("name")).toBe("query");
    });

    it("submits to the action it is given, so a listing can search itself before hydration", async () => {
        const wrapper = await mountSuspended(SearchForm, {
            props: { modelValue: "", action: "/publicaciones/" },
            global,
        });

        expect(wrapper.find("form").attributes("action")).toBe("/publicaciones/");
    });

    it("labels the field with the label it is given, since a placeholder alone is no accessible name", async () => {
        const wrapper = await mountSuspended(SearchForm, {
            props: { modelValue: "", label: "Buscar en el archivo", placeholder: "Título" },
            global,
        });

        expect(wrapper.find("label").text()).toBe("Buscar en el archivo");
        expect(wrapper.find("label").attributes("for")).toBe(
            wrapper.find("input").attributes("id"),
        );
    });

    it("caps the input at the length the route accepts, so the form never asks for a 404", async () => {
        const wrapper = await mountSuspended(SearchForm, { props: { modelValue: "" }, global });

        expect(wrapper.find("input").attributes("maxlength")).toBe(String(MAX_SEARCH_LENGTH));
    });

    it("hands the query to its parent on submit only, instead of on every keystroke", async () => {
        const wrapper = await mountSuspended(SearchForm, {
            props: { modelValue: "culpa" },
            global,
        });

        await wrapper.find("input").setValue("dolo");

        expect(wrapper.emitted("update:modelValue")).toBeUndefined();

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("update:modelValue")).toEqual([["dolo"]]);
    });

    it("hands an unchanged query up again, so resubmitting from a later page restarts at one", async () => {
        const wrapper = await mountSuspended(SearchForm, {
            props: { modelValue: "culpa" },
            global,
        });

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("update:modelValue")).toEqual([["culpa"]]);
    });

    it("fills the input with the query the page moves to, so back and forward keep them in step", async () => {
        const wrapper = await mountSuspended(SearchForm, {
            props: { modelValue: "culpa" },
            global,
        });

        await wrapper.find("input").setValue("dol");
        await wrapper.setProps({ modelValue: "dolo" });

        expect(wrapper.find("input").element.value).toBe("dolo");
    });
});
