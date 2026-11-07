import type { FormError } from "@nuxt/ui";
import * as v from "valibot";

export type SubmissionIssue = "invalid" | "long" | "required" | "fileType" | "fileSize";

export type SubmissionError = FormError & { message: SubmissionIssue };

export const SUBMISSION_KINDS = ["article", "tfg", "tfm"] as const;

// Netlify buffers 6 MB of request, which is 4.5 MB of binary once base64-encoded
export const MANUSCRIPT_MAX_BYTES = 4 * 1024 * 1024;

const MAX_NAME_LENGTH = 245;
const MAX_TITLE_LENGTH = 300;
const MAX_SUMMARY_LENGTH = 3000;

const startsWith = (bytes: Uint8Array, signature: number[]): boolean =>
    signature.every((byte, index) => bytes[index] === byte);

const isPlainText = (bytes: Uint8Array): boolean => {
    try {
        return !new TextDecoder("utf-8", { fatal: true }).decode(bytes).includes("\0");
    } catch {
        return false;
    }
};

const ZIP = [0x50, 0x4b, 0x03, 0x04];

/** What each accepted extension's bytes must look like, since a browser's MIME type is a guess. */
const MANUSCRIPT_SIGNATURES = {
    ".docx": (bytes) => startsWith(bytes, ZIP),
    ".pages": (bytes) => startsWith(bytes, ZIP),
    ".pdf": (bytes) => startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]),
    ".txt": isPlainText,
} as const satisfies Record<string, (bytes: Uint8Array) => boolean>;

type ManuscriptType = keyof typeof MANUSCRIPT_SIGNATURES;

export const MANUSCRIPT_TYPES = Object.keys(MANUSCRIPT_SIGNATURES) as ManuscriptType[];

const typeOf = (filename: string): ManuscriptType | undefined =>
    MANUSCRIPT_TYPES.find((type) => filename.toLowerCase().endsWith(type));

/** Whether a file's bytes match the type its name claims. */
export const isManuscript = (filename: string, bytes: Uint8Array): boolean => {
    const type = typeOf(filename);

    return type !== undefined && MANUSCRIPT_SIGNATURES[type](bytes);
};

const text = (message: (issue: SubmissionIssue) => string, maxLength: number) =>
    v.pipe(
        v.string(() => message("required")),
        v.trim(),
        v.nonEmpty(() => message("required")),
        v.maxLength(maxLength, () => message("long")),
    );

export const submissionSchema = (message: (issue: SubmissionIssue) => string) =>
    v.config(
        v.object({
            name: text(message, MAX_NAME_LENGTH),
            email: v.pipe(
                v.string(() => message("required")),
                v.trim(),
                v.nonEmpty(() => message("required")),
                v.email(() => message("invalid")),
            ),
            kind: v.picklist(SUBMISSION_KINDS, () => message("required")),
            title: v.optional(
                v.pipe(
                    v.string(),
                    v.trim(),
                    v.maxLength(MAX_TITLE_LENGTH, () => message("long")),
                ),
                "",
            ),
            summary: text(message, MAX_SUMMARY_LENGTH),
            // A `File` in the browser, the multipart part's name and length on the server
            file: v.nullish(
                v.pipe(
                    v.object({ name: v.string(), size: v.number() }, () => message("fileType")),
                    v.check(
                        ({ name }) => typeOf(name) !== undefined,
                        () => message("fileType"),
                    ),
                    v.check(
                        ({ size }) => size <= MANUSCRIPT_MAX_BYTES,
                        () => message("fileSize"),
                    ),
                ),
            ),
            // A boolean that must be true, not `literal(true)`, so a checkbox's state fits the input
            consent: v.pipe(
                v.boolean(() => message("required")),
                v.value(true, () => message("required")),
            ),
        }),
        { abortPipeEarly: true },
    );

export type Submission = v.InferOutput<ReturnType<typeof submissionSchema>>;
