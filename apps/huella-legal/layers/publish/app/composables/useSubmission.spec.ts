import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useSubmission } from "./useSubmission";

const FIELDS = {
    name: "Lucía Pérez",
    email: "lucia@ejemplo.es",
    kind: "tfg",
    title: "",
    summary: "La admisibilidad de los mensajes de WhatsApp como prueba.",
    file: new File(["PK"], "borrador.docx"),
    consent: true,
    honeypot: "",
} as const;

const fetch = vi.hoisted(() => vi.fn());

// The i18n loader fetches the locale through the same import, so only the route is faked
mockNuxtImport(
    "$fetch",
    () => (url: string, options: unknown) =>
        url === "/api/submissions" ? fetch(url, options) : globalThis.$fetch(url, options as never),
);

// A challenge with a token at hand: the waiting and the reset are FormChallenge's own spec
const challenge = vi.fn((send: (token: string) => Promise<unknown>) => send("tok")) as Challenge;

const setUp = async () => {
    let controller: ReturnType<typeof useSubmission> | undefined;

    await mountSuspended(
        defineComponent({
            setup: () => {
                controller = useSubmission();

                return () => null;
            },
        }),
    );

    return controller!;
};

beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue(undefined);
});

describe("useSubmission", () => {
    it("posts the proposal and its file as multipart with the challenge's token, then reports success", async () => {
        const submission = await setUp();

        await submission.send(FIELDS, challenge);

        const body = fetch.mock.calls[0]?.[1].body as FormData;

        expect(fetch).toHaveBeenCalledWith("/api/submissions", { method: "POST", body });
        expect(body.get("summary")).toBe(FIELDS.summary);
        expect((body.get("file") as File).name).toBe("borrador.docx");
        expect(body.get("token")).toBe("tok");
        expect(submission.status.value).toBe("success");
    });
});
