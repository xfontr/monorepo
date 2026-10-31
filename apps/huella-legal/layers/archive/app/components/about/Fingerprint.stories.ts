import type { Meta, StoryObj } from "@storybook/vue3-vite";

import AboutFingerprint from "./Fingerprint.vue";

const meta: Meta<typeof AboutFingerprint> = {
    args: { drawOnView: false },
    render: (args) => ({
        components: { AboutFingerprint },
        setup: () => ({ args }),
        template: `<AboutFingerprint v-bind="args" class="size-64 text-huella-teal-600" />`,
    }),
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DrawOnView: Story = {
    args: { drawOnView: true },
};
