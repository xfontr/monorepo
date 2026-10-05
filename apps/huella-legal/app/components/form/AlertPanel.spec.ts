import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import AlertPanel from "./AlertPanel.vue";

describe("alert panel", () => {
    it("is announced as an alert, with the title first and the detail from the slot", async () => {
        const wrapper = await mountSuspended(AlertPanel, {
            props: { title: "No hemos podido enviar tu propuesta" },
            slots: { default: () => "Inténtalo de nuevo." },
        });

        const lines = wrapper.findAll("[role=alert] [data-slot=title], [role=alert] [data-slot=description]").map((line) => line.text());

        expect(lines).toEqual(["No hemos podido enviar tu propuesta", "Inténtalo de nuevo."]);
    });

    it("leaves out the detail line when the slot is empty", async () => {
        const wrapper = await mountSuspended(AlertPanel, { props: { title: "Sin conexión" } });

        expect(wrapper.find("[data-slot=description]").exists()).toBe(false);
    });

    it("swaps the icon when given one", async () => {
        const fallback = await mountSuspended(AlertPanel, { props: { title: "Sin conexión" } });
        const custom = await mountSuspended(AlertPanel, { props: { title: "Archivo rechazado", icon: "i-lucide-file-x" } });

        expect(fallback.findComponent({ name: "UIcon" }).props("name")).toBe("i-lucide-wifi-off");
        expect(custom.findComponent({ name: "UIcon" }).props("name")).toBe("i-lucide-file-x");
    });

    it("takes the danger palette from the app config instead of Nuxt UI's translucent error tint", async () => {
        const wrapper = await mountSuspended(AlertPanel, { props: { title: "Sin conexión" } });

        const root = wrapper.get("[role=alert]").classes();

        expect(root).toContain("bg-huella-danger-50");
        expect(root).not.toContain("bg-error/10");
    });
});
