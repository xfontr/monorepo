import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { isManuscript, MANUSCRIPT_MAX_BYTES, submissionSchema } from "./submission";

const schema = submissionSchema((issue) => issue);

const VALID = {
    name: " Lucía Pérez ",
    email: " lucia@ejemplo.es ",
    kind: "tfg",
    title: " La prueba digital ",
    summary: " La admisibilidad de los mensajes de WhatsApp como prueba. ",
    consent: true,
};

const FILE = { name: "Borrador.DOCX", size: 700_000 };

const issues = (input: Record<string, unknown>) =>
    v.safeParse(schema, input).issues?.map((issue) => [v.getDotPath(issue), issue.message]);

const bytes = (...values: number[]) => new Uint8Array(values);

describe("submission schema", () => {
    it("trims every text field, so a pasted space never fails or reaches the inbox", () => {
        expect(v.parse(schema, VALID)).toEqual({
            name: "Lucía Pérez",
            email: "lucia@ejemplo.es",
            kind: "tfg",
            title: "La prueba digital",
            summary: "La admisibilidad de los mensajes de WhatsApp como prueba.",
            consent: true,
        });
    });

    it("accepts a proposal with no title and no file, since both are optional", () => {
        expect(issues({ ...VALID, title: undefined, file: null })).toBeUndefined();
    });

    it("accepts a file of exactly the cap", () => {
        expect(issues({ ...VALID, file: { ...FILE, size: MANUSCRIPT_MAX_BYTES } })).toBeUndefined();
    });

    it.each([
        ["a blank name", { name: "   " }, "name", "required"],
        ["an address with no domain", { email: "lucia@" }, "email", "invalid"],
        ["a kind the form never offers", { kind: "novela" }, "kind", "required"],
        ["a blank summary", { summary: "   " }, "summary", "required"],
        [
            "a .doc, which can carry macros",
            { file: { ...FILE, name: "a.doc" } },
            "file",
            "fileType",
        ],
        ["a file with no extension", { file: { ...FILE, name: "borrador" } }, "file", "fileType"],
        [
            "a file one byte over the cap",
            { file: { ...FILE, size: MANUSCRIPT_MAX_BYTES + 1 } },
            "file",
            "fileSize",
        ],
        ["a file that is not a file", { file: "borrador.docx" }, "file", "fileType"],
        ["consent left unticked", { consent: false }, "consent", "required"],
    ])("rejects %s with the issue the caller words", (_, change, field, issue) => {
        expect(issues({ ...VALID, ...change })).toEqual([[field, issue]]);
    });

    it("names every missing field at once, so the author fixes them in one pass", () => {
        expect(issues({})?.map(([field]) => field)).toEqual([
            "name",
            "email",
            "kind",
            "summary",
            "consent",
        ]);
    });
});

describe("isManuscript", () => {
    it.each([
        ["a .docx", "a.docx", bytes(0x50, 0x4b, 0x03, 0x04, 0x14)],
        ["a .pages", "a.pages", bytes(0x50, 0x4b, 0x03, 0x04, 0x0a)],
        ["a .pdf", "a.PDF", new TextEncoder().encode("%PDF-1.7")],
        ["a UTF-8 .txt", "a.txt", new TextEncoder().encode("Introducción al artículo")],
    ])("accepts %s whose bytes match its name", (_, name, content) => {
        expect(isManuscript(name, content)).toBe(true);
    });

    it.each([
        ["an executable renamed .docx", "a.docx", bytes(0x4d, 0x5a, 0x90, 0x00)],
        ["a legacy Word file renamed .docx", "a.docx", bytes(0xd0, 0xcf, 0x11, 0xe0)],
        ["a .pdf that is really a ZIP", "a.pdf", bytes(0x50, 0x4b, 0x03, 0x04)],
        ["a .txt holding binary", "a.txt", bytes(0x48, 0x00, 0x49)],
        ["a .txt that is not UTF-8", "a.txt", bytes(0xff, 0xfe, 0x41)],
        ["an extension the form never offers", "a.rtf", new TextEncoder().encode("{\\rtf1")],
    ])("refuses %s", (_, name, content) => {
        expect(isManuscript(name, content)).toBe(false);
    });
});
