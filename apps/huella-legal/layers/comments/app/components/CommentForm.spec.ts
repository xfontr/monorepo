import type { FormError } from "@nuxt/ui";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import type { FormPostStatus } from "#layers/forms/app/composables/useFormPost";
import type { PostCommentFailure } from "../composables/usePostComment";
import CommentForm from "./CommentForm.vue";

const MESSAGES = {
    commentForm: {
        cancelReply: "cancel reply",
        consent: { label: "consent label", name: "consent" },
        content: { label: "content label", name: "content" },
        email: { hint: "hidden", label: "email label", name: "email", placeholder: "placeholder" },
        error: {
            closed: "closed",
            duplicate: "duplicate",
            flood: "flood",
            title: "error title",
            unavailable: "unavailable",
        },
        errors: { invalid: "invalid value", long: "long value", required: "required value" },
        name: { hint: "public", label: "name label", name: "name" },
        notice: "notice {privacy}",
        privacy: "privacy",
        replyingTo: "replying to {author}",
        submit: "submit",
        success: { description: "success description", title: "success title" },
    },
    formErrorSummary: { item: "{field}: {message}", title: "one field | {count} fields" },
};

const FIELDS = { name: "Lucía Pérez", email: "lucia@ejemplo.es", content: "Muy buen artículo." };

const REPLY_TO: ReaderComment = {
    id: "9",
    author: "Ana",
    publishedAt: "2024-03-12T09:00:00Z",
    paragraphs: ["Hola"],
};

const comment = vi.hoisted(() => ({
    status: undefined as unknown as import("vue").Ref<FormPostStatus>,
    errors: undefined as unknown as import("vue").Ref<FormError[]>,
    failure: undefined as unknown as import("vue").Ref<PostCommentFailure | undefined>,
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

vi.mock("../composables/usePostComment", () => ({ usePostComment: () => comment }));

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>;

const mount = (props: { replyTo?: ReaderComment } = {}) =>
    mountSuspended(CommentForm, {
        props: { postId: "42", ...props },
        global: { stubs: { FormChallenge } },
        attachTo: document.body,
    });

const fill = async (wrapper: Wrapper, fields: Partial<typeof FIELDS>, consent = true) => {
    const { name = "", email = "", content = "" } = fields;

    await wrapper.find("input[autocomplete=name]").setValue(name);
    await wrapper.find("input[type=email]").setValue(email);
    await wrapper.find("textarea").setValue(content);
    if (consent) await wrapper.find("[role=checkbox]").trigger("click");
};

const submit = async (wrapper: Wrapper) => {
    await wrapper.find("form").trigger("submit");
    await flushPromises();
};

describe("comment form", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    beforeEach(() => {
        vi.clearAllMocks();
        comment.status = ref("idle");
        comment.errors = ref([]);
        comment.failure = ref();
    });

    it("sends the trimmed fields as a top-level comment on the article, with the honeypot", async () => {
        const wrapper = await mount();

        await fill(wrapper, { ...FIELDS, name: ` ${FIELDS.name} ` });
        await submit(wrapper);

        expect(comment.send).toHaveBeenCalledWith(
            { ...FIELDS, consent: true, post: "42", parent: "0", website: "" },
            challenge,
        );
    });

    it("sends a reply under the comment it answers, and says whom it answers", async () => {
        const wrapper = await mount({ replyTo: REPLY_TO });

        await fill(wrapper, FIELDS);
        await submit(wrapper);

        expect(wrapper.text()).toContain("replying to Ana");
        expect(comment.send).toHaveBeenCalledWith(
            expect.objectContaining({ parent: "9" }),
            challenge,
        );
    });

    it("moves focus to the comment field when a reply starts, so the reader lands where they type", async () => {
        const wrapper = await mount();

        await wrapper.setProps({ replyTo: REPLY_TO });
        await flushPromises();

        expect(document.activeElement).toBe(wrapper.find("textarea").element);
        wrapper.unmount();
    });

    it("asks the section to drop the reply when the reader cancels it", async () => {
        const wrapper = await mount({ replyTo: REPLY_TO });

        await wrapper
            .findAll("button")
            .find((button) => button.text() === "cancel reply")!
            .trigger("click");

        expect(wrapper.emitted("cancelReply")).toHaveLength(1);
    });

    it("withholds the request without consent, and blames the checkbox", async () => {
        const wrapper = await mount();

        await fill(wrapper, FIELDS, false);
        await submit(wrapper);

        expect(comment.send).not.toHaveBeenCalled();
        expect(wrapper.find("[role=alert]").text()).toContain("consent: required value");
    });

    it("refuses a comment past the length WordPress would take, without sending it", async () => {
        const wrapper = await mount();

        await fill(wrapper, { ...FIELDS, content: "x".repeat(5001) });
        await submit(wrapper);

        expect(comment.send).not.toHaveBeenCalled();
        expect(wrapper.find("[role=alert]").text()).toContain("content: long value");
    });

    it.each(["duplicate", "closed", "flood", "unavailable"] as const)(
        "tells the reader why the comment failed when it was %s, keeping the form",
        async (failure) => {
            comment.status = ref("error");
            comment.failure = ref(failure);
            const wrapper = await mount();

            expect(wrapper.find("[role=alert]").text()).toContain(failure);
            expect(wrapper.find("textarea").exists()).toBe(true);
        },
    );

    it("replaces the form with the success panel, so nobody sends the comment twice", async () => {
        comment.status = ref("success");
        const wrapper = await mount();

        expect(wrapper.find("form").exists()).toBe(false);
        expect(wrapper.find("h3").text()).toBe("success title");
    });

    it("links the privacy section from the notice", async () => {
        const wrapper = await mount();

        expect(wrapper.find("form p a").attributes("href")).toBe("/aviso-legal/#privacidad");
    });
});
