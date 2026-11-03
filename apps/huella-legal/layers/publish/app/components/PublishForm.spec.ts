import type { FormError } from "@nuxt/ui";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import type { FormPostStatus } from "#layers/forms/app/composables/useFormPost";
import { MANUSCRIPT_MAX_BYTES } from "../../shared/schemas/submission";
import PublishForm from "./PublishForm.vue";

const MESSAGES = {
    publishForm: {
        consent: { label: "consent label", name: "consent" },
        email: { label: "email label", name: "email", placeholder: "placeholder" },
        error: { description: "error description", title: "error title" },
        errors: {
            fileSize: "too large",
            fileType: "wrong type",
            invalid: "invalid value",
            required: "required value",
        },
        file: {
            description: "file description",
            help: "file help",
            label: "file label",
            name: "file",
            upload: "upload",
        },
        kind: {
            items: { article: "Artículo", tfg: "TFG", tfm: "TFM" },
            label: "kind label",
            name: "kind",
        },
        name: { label: "name label", name: "name" },
        notice: "notice {privacy}",
        privacy: "privacy",
        submit: "submit",
        success: { description: "success description", title: "success title" },
        summary: { help: "summary help", label: "summary label", name: "summary" },
        title: { label: "title label", name: "title" },
    },
    formErrorSummary: { item: "{field}: {message}", title: "one field | {count} fields" },
};

const FIELDS = {
    name: "Lucía Pérez",
    email: "lucia@ejemplo.es",
    summary: "La admisibilidad de los mensajes de WhatsApp como prueba.",
};

const submission = vi.hoisted(() => ({
    status: undefined as unknown as import("vue").Ref<FormPostStatus>,
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

vi.mock("../composables/useSubmission", () => ({ useSubmission: () => submission }));

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>;

const mount = () => mountSuspended(PublishForm, { global: { stubs: { FormChallenge } } });

const fill = async (wrapper: Wrapper, fields: Partial<typeof FIELDS>, consent = true) => {
    const { name = "", email = "", summary = "" } = fields;

    await wrapper.find("input[autocomplete=name]").setValue(name);
    await wrapper.find("input[type=email]").setValue(email);
    await wrapper.find("textarea").setValue(summary);
    if (consent) await wrapper.find("[role=checkbox]").trigger("click");
};

const attach = async (wrapper: Wrapper, file: File) => {
    // UFileUpload previews through Node's URL, which refuses the test DOM's File
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:borrador");

    const input = wrapper.find("input[type=file]");

    Object.defineProperty(input.element, "files", { value: [file], configurable: true });
    await input.trigger("change");
};

const submit = async (wrapper: Wrapper) => {
    await wrapper.find("form").trigger("submit");
    await flushPromises();
};

describe("publish form", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    beforeEach(() => {
        vi.clearAllMocks();
        submission.status = ref("idle");
        submission.errors = ref([]);
    });

    it("sends a proposal with no file, defaulting the kind to an article", async () => {
        const wrapper = await mount();

        await fill(wrapper, { ...FIELDS, email: ` ${FIELDS.email} ` });
        await submit(wrapper);

        expect(submission.send).toHaveBeenCalledWith(
            { ...FIELDS, kind: "article", title: "", file: null, consent: true, honeypot: "" },
            challenge,
        );
    });

    it("sends the attached File itself, not the reactive proxy FormData would refuse", async () => {
        const wrapper = await mount();
        const file = new File(["PK"], "borrador.docx");

        await fill(wrapper, FIELDS);
        await attach(wrapper, file);
        await submit(wrapper);

        expect(submission.send.mock.calls[0]?.[0].file).toBe(file);
    });

    it("refuses a file over the cap on the file field, without sending", async () => {
        const wrapper = await mount();
        const file = new File(["x"], "borrador.pdf");

        Object.defineProperty(file, "size", { value: MANUSCRIPT_MAX_BYTES + 1 });
        await fill(wrapper, FIELDS);
        await attach(wrapper, file);
        await submit(wrapper);

        expect(submission.send).not.toHaveBeenCalled();
        expect(wrapper.find("[role=alert]").text()).toContain("file: too large");
    });

    it("offers only the accepted file types to the picker", async () => {
        const wrapper = await mount();

        expect(wrapper.find("input[type=file]").attributes("accept")).toBe(
            ".docx,.pages,.pdf,.txt",
        );
    });

    it("lists every invalid field in a summary that links to it", async () => {
        const wrapper = await mount();

        await fill(wrapper, { name: "   ", email: "lucia@" }, false);
        await submit(wrapper);

        const links = wrapper.findAll("[role=alert] a");

        expect(submission.send).not.toHaveBeenCalled();
        expect(links.map((link) => link.text())).toEqual(["name", "email", "summary", "consent"]);
    });

    it("words the server's codes on their fields and in the summary", async () => {
        submission.send.mockImplementation(() => {
            submission.status.value = "invalid";
            submission.errors.value = [{ name: "file", message: "fileType" }];
        });
        const wrapper = await mount();

        await fill(wrapper, FIELDS);
        await submit(wrapper);

        expect(wrapper.find("[role=alert]").text()).toContain("file: wrong type");
    });

    it("marks the form busy while submitting, keeping what was typed", async () => {
        const wrapper = await mount();

        await fill(wrapper, FIELDS);
        submission.status.value = "submitting";
        await flushPromises();

        const textarea = wrapper.find("textarea");

        expect(wrapper.find("form").attributes("aria-busy")).toBe("true");
        expect(textarea.attributes("disabled")).toBeDefined();
        expect((textarea.element as HTMLTextAreaElement).value).toBe(FIELDS.summary);
    });

    it("announces a failed request and keeps the form for a retry", async () => {
        submission.status = ref("error");
        const wrapper = await mount();

        expect(wrapper.find("[role=alert]").text()).toContain("error title");
        expect(wrapper.find("textarea").exists()).toBe(true);
    });

    it("replaces the form with the success panel, so nobody sends the proposal twice", async () => {
        submission.status = ref("success");
        const wrapper = await mount();

        expect(wrapper.find("form").exists()).toBe(false);
        expect(wrapper.find("h3").text()).toBe("success title");
    });

    it("links the privacy section from the notice", async () => {
        const wrapper = await mount();

        expect(wrapper.find("form p a").attributes("href")).toBe("/aviso-legal/#privacidad");
    });
});
