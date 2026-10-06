import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import SuccessPanel from "./SuccessPanel.vue";

describe("success panel", () => {
    it("takes focus to its heading on mount, since it replaces the form and the submit button that held focus", async () => {
        const wrapper = await mountSuspended(SuccessPanel, { props: { title: "Recibido." }, attachTo: document.body });

        expect(document.activeElement?.tagName).toBe("H3");
        expect(document.activeElement?.textContent?.trim()).toBe("Recibido.");
        wrapper.unmount();
    });

    it("renders the slot as the body, and drops the paragraph without one", async () => {
        const withBody = await mountSuspended(SuccessPanel, {
            props: { title: "Recibido." },
            slots: { default: () => "Te escribiremos pronto." },
        });
        const without = await mountSuspended(SuccessPanel, { props: { title: "Recibido." } });

        expect(withBody.find("p").text()).toBe("Te escribiremos pronto.");
        expect(without.find("p").exists()).toBe(false);
    });

    it("links the follow-up action only when one is given", async () => {
        const withAction = await mountSuspended(SuccessPanel, {
            props: { title: "Recibido.", action: { label: "Enviar otra propuesta", to: "/publicar#formulario" } },
        });
        const without = await mountSuspended(SuccessPanel, { props: { title: "Recibido." } });

        const link = withAction.find("a");

        expect([link.text(), link.attributes("href")]).toEqual(["Enviar otra propuesta", "/publicar#formulario"]);
        expect(without.find("a").exists()).toBe(false);
    });
});
