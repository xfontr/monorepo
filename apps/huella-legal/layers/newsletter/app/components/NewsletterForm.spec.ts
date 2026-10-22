import type { FormError } from "@nuxt/ui";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import type { NewsletterStatus } from "../composables/useNewsletter";
import NewsletterForm from "./NewsletterForm.vue";

const MESSAGES = {
    newsletterForm: {
        email: {
            errors: {
                invalid: "invalid address",
                rejected: "rejected address",
                required: "required address",
            },
            label: "email",
            placeholder: "placeholder",
        },
        error: { description: "error description", title: "error title" },
        notice: "notice {privacy}",
        privacy: "privacy",
        submit: "submit",
        success: { description: "success description", title: "success title" },
    },
};

const newsletter = vi.hoisted(() => ({
    status: undefined as unknown as import("vue").Ref<NewsletterStatus>,
    errors: undefined as unknown as import("vue").Ref<FormError[]>,
    subscribe: vi.fn(),
}));

const challenge = vi.hoisted(() => vi.fn());

// The real challenge mounts Cloudflare's widget, so only its slot contract with the form is kept
const FormChallenge = defineComponent({
    setup:
        (_, { slots }) =>
        () =>
            slots.default?.({ challenge }),
});

vi.mock("../composables/useNewsletter", () => ({ useNewsletter: () => newsletter }));

const mount = (props: Record<string, unknown> = {}) =>
    mountSuspended(NewsletterForm, { props, global: { stubs: { FormChallenge } } });

const submit = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>, email: string) => {
    await wrapper.find("input[type=email]").setValue(email);
    await wrapper.find("form").trigger("submit");
    await flushPromises();
};

describe("newsletter form", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    beforeEach(() => {
        vi.clearAllMocks();
        newsletter.status = ref("idle");
        newsletter.errors = ref([]);
    });

    it("subscribes the trimmed address through the challenge, so a token rides with it", async () => {
        const wrapper = await mount();

        await submit(wrapper, " lucia@ejemplo.es ");

        expect(newsletter.subscribe).toHaveBeenCalledWith(
            { email: "lucia@ejemplo.es", website: "" },
            challenge,
        );
    });

    it("sends what a bot typed into the honeypot, which sits inside the form it guards", async () => {
        const wrapper = await mount();

        await wrapper.find("form input[name=sitio]").setValue("https://spam.test");
        await submit(wrapper, "lucia@ejemplo.es");

        expect(newsletter.subscribe).toHaveBeenCalledWith(
            { email: "lucia@ejemplo.es", website: "https://spam.test" },
            challenge,
        );
    });

    it.each([
        ["an empty field", "", "required address"],
        ["a blank field", "   ", "required address"],
        ["an address with no domain", "lucia@", "invalid address"],
    ])("withholds the request and shows the field error on %s", async (_, email, message) => {
        const wrapper = await mount();

        await submit(wrapper, email);

        expect(newsletter.subscribe).not.toHaveBeenCalled();
        expect(wrapper.find("[data-slot=error]").text()).toBe(message);
    });

    it("marks the form busy and locks the field while submitting, keeping what was typed", async () => {
        const wrapper = await mount();

        await wrapper.find("input[type=email]").setValue("lucia@ejemplo.es");
        newsletter.status.value = "submitting";
        await flushPromises();

        const input = wrapper.find("input[type=email]");

        expect(wrapper.find("form").attributes("aria-busy")).toBe("true");
        expect(input.attributes("disabled")).toBeDefined();
        expect((input.element as HTMLInputElement).value).toBe("lucia@ejemplo.es");
        expect(wrapper.findComponent({ name: "UButton" }).props("loading")).toBe(true);
    });

    it.each([
        ["invalid", "invalid address"],
        ["rejected", "rejected address"],
    ])("words the server's %s code on the input, so it is read with it", async (code, message) => {
        newsletter.subscribe.mockImplementation(() => {
            newsletter.status.value = "invalid";
            newsletter.errors.value = [{ name: "email", message: code }];
        });
        const wrapper = await mount();

        await submit(wrapper, "lucia@ejemplo.es");

        const input = wrapper.find("input[type=email]");
        const error = wrapper.find("[data-slot=error]");

        expect(error.text()).toBe(message);
        expect(input.attributes("aria-invalid")).toBe("true");
        expect(input.attributes("aria-describedby")).toContain(error.attributes("id"));
    });

    it("announces a failed request and keeps the form for a retry", async () => {
        newsletter.status = ref("error");
        const wrapper = await mount();

        expect(wrapper.find("[role=alert]").text()).toContain("error title");
        expect(wrapper.find("input[type=email]").exists()).toBe(true);
    });

    it("replaces the form with the success panel, so nobody subscribes twice", async () => {
        newsletter.status = ref("success");
        const wrapper = await mount();

        expect(wrapper.find("form").exists()).toBe(false);
        expect(wrapper.find("h3").text()).toBe("success title");
    });

    it("links the privacy section from the notice under the field", async () => {
        const wrapper = await mount();

        expect(wrapper.find("form p a").attributes("href")).toBe("/aviso-legal/#privacidad");
    });

    it.each([
        ["stacked", true],
        ["inline", false],
    ] as const)("stretches the button only in the %s layout", async (layout, block) => {
        const wrapper = await mount({ layout });

        expect(wrapper.findComponent({ name: "UButton" }).props("block")).toBe(block);
    });

    it.each([
        ["paper", "primary"],
        ["slate", "secondary"],
    ] as const)(
        "gives the %s tone a %s button, so it keeps contrast on its background",
        async (tone, color) => {
            const wrapper = await mount({ tone });

            expect(wrapper.findComponent({ name: "UButton" }).props("color")).toBe(color);
        },
    );
});
