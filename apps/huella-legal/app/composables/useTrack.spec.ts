import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import type { AnalyticsEvent } from "~/types/AnalyticsEvent";

describe("useTrack", () => {
    it("raises the event as the hook the tracking layer listens to", async () => {
        const heard = vi.fn<(event: AnalyticsEvent) => void>();
        const unhook = useNuxtApp().hook("analytics:event", heard);

        await mountSuspended(
            defineComponent({
                setup: () => {
                    useTrack()("share", { method: "print" });

                    return () => null;
                },
            }),
        );
        unhook();

        expect(heard).toHaveBeenCalledWith({
            name: "share",
            params: { method: "print" },
        });
    });
});
