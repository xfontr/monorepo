import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ErrorDebug from "./ErrorDebug.vue";

const NOT_FOUND = { status: 404, message: "Page not found", stack: "Error: Page not found\n    at render" };

function mountDebug(error: Record<string, unknown>) {
    return mountSuspended(ErrorDebug, { props: { error: error as never } });
}

describe("error debug panel", () => {
    it("opens the upstream message first when the error carries one", async () => {
        const wrapper = await mountDebug({ ...NOT_FOUND, data: { message: "WordPress answered 404" } });

        const [message, data, stack] = wrapper.findAll("details");

        expect(message?.attributes("open")).toBeDefined();
        expect(message?.text()).toContain("WordPress answered 404");
        expect(data?.attributes("open")).toBeUndefined();
        expect(stack?.text()).toContain("at render");
    });

    it("offers only the stack when the error carries no data", async () => {
        const wrapper = await mountDebug(NOT_FOUND);

        expect(wrapper.findAll("summary").map((summary) => summary.text())).toEqual(["Stack"]);
    });

    it("keeps data without a message closed, so an unlabelled payload never leads", async () => {
        const wrapper = await mountDebug({ ...NOT_FOUND, data: { upstream: 404 } });

        const [data] = wrapper.findAll("details");

        expect(data?.find("summary").text()).toBe("Data");
        expect(data?.attributes("open")).toBeUndefined();
    });
});
