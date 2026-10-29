import type { Meta, StoryObj } from "@storybook/vue3-vite";

import PageIntro from "./PageIntro.vue";

const meta: Meta<typeof PageIntro> = {
    component: PageIntro,
    args: {
        breadcrumbs: [{ label: "Publicaciones", to: "#" }, { label: "Derecho penal" }],
    },
    render: (args) => ({
        components: { PageIntro },
        setup: () => ({ args }),
        template: `<PageIntro v-bind="args"><p class="font-serif text-h1">Derecho penal</p></PageIntro>`,
    }),
};

export default meta;

type Story = StoryObj<typeof PageIntro>;

export const Subject: Story = {};

export const Archive: Story = { args: { breadcrumbs: [{ label: "Publicaciones" }] } };
