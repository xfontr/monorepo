import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ArchiveHeading from "./Heading.vue";

const props = { kicker: "Materia · 12 publicaciones", title: "Derecho penal" };

describe("archive heading", () => {
    it("titles the page with its one h1, under the kicker", async () => {
        const wrapper = await mountSuspended(ArchiveHeading, { props });

        expect(wrapper.findAll("h1").map((heading) => heading.text())).toEqual(["Derecho penal"]);
        expect(wrapper.text().indexOf(props.kicker)).toBeLessThan(
            wrapper.text().indexOf(props.title),
        );
    });

    it("draws no empty paragraph when there is no lead", async () => {
        const bare = await mountSuspended(ArchiveHeading, { props });
        const led = await mountSuspended(ArchiveHeading, {
            props: { ...props, lead: "Teoría del delito." },
        });

        expect(bare.find("p").exists()).toBe(false);
        expect(led.find("p").text()).toBe("Teoría del delito.");
    });
});
