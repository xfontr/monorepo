import type { Submission } from "../../shared/schemas/submission";
import { isManuscript, MANUSCRIPT_TYPES, submissionSchema } from "../../shared/schemas/submission";

const schema = submissionSchema((issue) => issue);

const KINDS = {
    article: "Artículo",
    tfg: "TFG",
    tfm: "TFM",
} as const satisfies Record<Submission["kind"], string>;

export default defineEventHandler(async (event): Promise<void> => {
    const form = await readFormData(event).catch(() => new FormData());
    const upload = form.get("file");
    const file = upload instanceof File ? upload : undefined;

    if (form.get("honeypot")) return;

    await assertChallenge(event, form.get("token")?.toString());

    const { name, email, kind, title, summary } = assertForm(schema, {
        ...Object.fromEntries(form),
        file,
        consent: form.get("consent") === "true",
    });

    const manuscript = file && { name: file.name, bytes: Buffer.from(await file.arrayBuffer()) };

    if (manuscript && !isManuscript(manuscript.name, manuscript.bytes))
        throw createError({
            statusCode: 422,
            statusMessage: "Invalid form",
            data: [{ name: "file", message: "fileType" }],
        });

    const heading = `Tipo: ${KINDS[kind]}\nTítulo provisional: ${title || "-"}`;

    await sendMail(event, {
        to: useRuntimeConfig(event).public.submissionEmail,
        replyTo: email,
        subject: `Propuesta (${KINDS[kind]}): ${name}`,
        text: [heading, summary, `— ${name} <${email}>`].join("\n\n"),
        attachments: manuscript && [
            { filename: manuscript.name, content: manuscript.bytes.toString("base64") },
        ],
    });
});

defineRouteMeta({
    openAPI: {
        tags: ["Forms"],
        summary: "Send a publication proposal, optionally with its draft, to the editors",
        requestBody: {
            required: true,
            content: {
                "multipart/form-data": {
                    schema: {
                        type: "object",
                        required: ["name", "email", "kind", "summary", "consent", "token"],
                        properties: {
                            name: { type: "string" },
                            email: { type: "string", format: "email" },
                            kind: { type: "string", enum: ["article", "tfg", "tfm"] },
                            title: { type: "string" },
                            summary: { type: "string" },
                            file: {
                                type: "string",
                                format: "binary",
                                description: `One of ${MANUSCRIPT_TYPES.join(" ")}, at most 4 MB`,
                            },
                            consent: { type: "string", const: "true" },
                            token: { type: "string", description: "A Turnstile token" },
                            honeypot: { type: "string", description: "Left empty" },
                        },
                    },
                },
            },
        },
        responses: {
            204: { description: "Sent, or silently dropped when the honeypot is filled" },
            403: { description: "The Turnstile challenge failed" },
            422: { description: "One `{ name, message }` per invalid field, under `data`" },
            502: { description: "Resend or Turnstile is unavailable" },
        },
    },
});
