import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SiteHeader from "./SiteHeader.vue";

const meta: Meta<typeof SiteHeader> = {
    component: SiteHeader,
    args: {
        issn: "2696-7618",
        sections: [
            { label: "Publicaciones", to: { name: "publications" } },
            { label: "Materias", to: { name: "categories" } },
            { label: "Colaboradores", to: { name: "authors" } },
            { label: "Publicar", to: { name: "publish" } },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof SiteHeader>;

export const Default: Story = {};

export const SectionCurrent: Story = {
    args: {
        sections: [
            { label: "Publicaciones", to: { name: "publications" } },
            { "label": "Materias", "to": { name: "categories" }, "active": true, "aria-current": "page" },
            { label: "Colaboradores", to: { name: "authors" } },
            { label: "Publicar", to: { name: "publish" } },
        ],
    },
};
