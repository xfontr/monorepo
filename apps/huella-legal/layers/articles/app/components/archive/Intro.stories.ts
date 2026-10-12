import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArchiveIntro from "./Intro.vue";

const meta: Meta<typeof ArchiveIntro> = {
    component: ArchiveIntro,
    args: {
        breadcrumbs: [{ label: "Publicaciones", to: "#" }, { label: "Derecho penal" }],
    },
    render: (args) => ({
        components: { ArchiveIntro },
        setup: () => ({ args }),
        template: `<ArchiveIntro v-bind="args"><p class="font-serif text-h1">Derecho penal</p></ArchiveIntro>`,
    }),
};

export default meta;

type Story = StoryObj<typeof ArchiveIntro>;

export const Subject: Story = {};

export const Archive: Story = { args: { breadcrumbs: [{ label: "Publicaciones" }] } };
