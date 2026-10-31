import type { Meta, StoryObj } from "@storybook/vue3-vite";

import AboutIntro from "./Intro.vue";

const meta: Meta<typeof AboutIntro> = {
    component: AboutIntro,
    args: { articles: 132, authors: 47 },
};

export default meta;

type Story = StoryObj<typeof AboutIntro>;

export const Default: Story = {};
