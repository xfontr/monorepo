import { describe, expect, it } from "vitest";
import { consentTranslation } from "./consentTranslation";

const translate = (key: string) => `t(${key})`;
const POLICY = "/aviso-legal/#cookies";

describe("consentTranslation", () => {
    it("offers a toggle only for necessary cookies and the categories a tracker needs", () => {
        const { preferencesModal } = consentTranslation(translate, ["analytics"], POLICY);

        expect(preferencesModal.sections.map(({ linkedCategory }) => linkedCategory)).toEqual([
            undefined,
            "necessary",
            "analytics",
            undefined,
        ]);
    });

    it("links the banner to the cookie policy, so a reader can read it before choosing", () => {
        const { consentModal } = consentTranslation(translate, [], POLICY);

        expect(consentModal.footer).toBe(`<a href="${POLICY}">t(cookieConsent.policy)</a>`);
    });
});
