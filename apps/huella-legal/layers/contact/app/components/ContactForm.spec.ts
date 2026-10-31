import type { FormError } from "@nuxt/ui";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import type { ContactStatus } from "../composables/useContact";
import ContactForm from "./ContactForm.vue";

const MESSAGES = {
    contactForm: {
        consent: { label: "consent label", name: "consent" },
        email: { label: "email label", name: "email", placeholder: "placeholder" },
        error: { description: "error description", title: "error title" },
        errors: { invalid: "invalid value", required: "required value" },
        message: { label: "message label", name: "message" },
        name: { label: "name label", name: "name" },
        notice: "notice {privacy}",
        privacy: "privacy",
        submit: "submit",
        success: { description: "success description", title: "success title" },
    },
    formErrorSummary: { item: "{field}: {message}", title: "one field | {count} fields" },
};

const FIELDS = {
    name: "Lucía Pérez",
    email: "lucia@ejemplo.es",
    message: "Una pregunta sobre un artículo.",
};

const contact = vi.hoisted(() => ({
    status: undefined as unknown as import("vue").Ref<ContactStatus>,
    errors: undefined as unknown as import("vue").Ref<FormError[]>,
    send: vi.fn(),
}));

const challenge = vi.hoisted(() => vi.fn());

// The real challenge mounts Cloudflare's widget, so only its slot contract with the form is kept
const FormChallenge = defineComponent({
    setup:
        (_, { slots }) =>
        () =>
            slots.default?.({ challenge }),
});

vi.mock("../composables/useContact", () => ({ useContact: () => contact }));

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>;

const mount = () => mountSuspended(ContactForm, { global: { stubs: { FormChallenge } } });

const fill = async (wrapper: Wrapper, fields: Partial<typeof FIELDS>, consent = true) => {
    const { name = "", email = "", message = "" } = fields;

    await wrapper.find("input[autocomplete=name]").setValue(name);
    await wrapper.find("input[type=email]").setValue(email);
    await wrapper.find("textarea").setValue(message);
    if (consent) await wrapper.find("[role=checkbox]").trigger("click");
};

const submit = async (wrapper: Wrapper) => {
    await wrapper.find("form").trigger("submit");
    await flushPromises();
};

describe("contact form", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    beforeEach(() => {
        vi.clearAllMocks();
        contact.status = ref("idle");
        contact.errors = ref([]);
    });

    it("sends the trimmed fields, the consent and the honeypot through the challenge", async () => {
        const wrapper = await mount();

        await fill(wrapper, { ...FIELDS, email: ` ${FIELDS.email} ` });
        await submit(wrapper);

        expect(contact.send).toHaveBeenCalledWith(
            { ...FIELDS, consent: true, website: "" },
            challenge,
        );
    });

    it("sends what a bot typed into the honeypot, which sits inside the form it guards", async () => {
        const wrapper = await mount();

        await fill(wrapper, FIELDS);
        await wrapper.find("form input[name=sitio]").setValue("https://spam.test");
        await submit(wrapper);

        expect(contact.send).toHaveBeenCalledWith(
            expect.objectContaining({ website: "https://spam.test" }),
            challenge,
        );
    });

    it("withholds the request without consent, and blames the checkbox", async () => {
        const wrapper = await mount();

        await fill(wrapper, FIELDS, false);
        await submit(wrapper);

        expect(contact.send).not.toHaveBeenCalled();
        expect(wrapper.find("[role=alert]").text()).toContain("consent: required value");
    });

    it("lists every invalid field in a summary that links to it", async () => {
        const wrapper = await mount();

        await fill(wrapper, { name: "   ", email: "lucia@" });
        await submit(wrapper);

        const links = wrapper.findAll("[role=alert] a");
        const email = wrapper.find("input[type=email]");

        expect(contact.send).not.toHaveBeenCalled();
        expect(links.map((link) => link.text())).toEqual(["name", "email", "message"]);
        expect(links[1]!.attributes("href")).toBe(`#${email.attributes("id")}`);
        expect(email.attributes("aria-invalid")).toBe("true");
    });

    it("marks the form busy and locks the fields while submitting, keeping what was typed", async () => {
        const wrapper = await mount();

        await fill(wrapper, FIELDS);
        contact.status.value = "submitting";
        await flushPromises();

        const textarea = wrapper.find("textarea");

        expect(wrapper.find("form").attributes("aria-busy")).toBe("true");
        expect(textarea.attributes("disabled")).toBeDefined();
        expect((textarea.element as HTMLTextAreaElement).value).toBe(FIELDS.message);
        expect(wrapper.findComponent({ name: "UButton" }).props("loading")).toBe(true);
    });

    it("words the server's codes on their fields and in the summary", async () => {
        contact.send.mockImplementation(() => {
            contact.status.value = "invalid";
            contact.errors.value = [{ name: "email", message: "invalid" }];
        });
        const wrapper = await mount();

        await fill(wrapper, FIELDS);
        await submit(wrapper);

        const input = wrapper.find("input[type=email]");
        const error = wrapper.find("[data-slot=error]");

        expect(error.text()).toBe("invalid value");
        expect(input.attributes("aria-describedby")).toContain(error.attributes("id"));
        expect(wrapper.find("[role=alert]").text()).toContain("email: invalid value");
    });

    it("announces a failed request and keeps the form for a retry", async () => {
        contact.status = ref("error");
        const wrapper = await mount();

        expect(wrapper.find("[role=alert]").text()).toContain("error title");
        expect(wrapper.find("textarea").exists()).toBe(true);
    });

    it("replaces the form with the success panel, so nobody sends the message twice", async () => {
        contact.status = ref("success");
        const wrapper = await mount();

        expect(wrapper.find("form").exists()).toBe(false);
        expect(wrapper.find("h3").text()).toBe("success title");
    });

    it("links the privacy section from the notice", async () => {
        const wrapper = await mount();

        expect(wrapper.find("form p a").attributes("href")).toBe("/aviso-legal/#privacidad");
    });
});
