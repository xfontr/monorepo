import type { NavigationMenuItem } from "@nuxt/ui";
import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SiteHeader from "./SiteHeader.vue";

const JOURNAL: NavigationMenuItem = {
    label: "Revista",
    to: { name: "about" },
    children: [
        {
            label: "Sobre Huella Legal",
            description: "Quiénes somos, qué publicamos y cómo",
            to: { name: "about" },
        },
        {
            label: "Colaboradores",
            description: "Quienes escriben la revista y su trayectoria",
            to: { name: "authors" },
        },
    ],
};

const meta: Meta<typeof SiteHeader> = {
    component: SiteHeader,
    args: {
        issn: "2696-7618",
        sections: [
            { label: "Publicaciones", to: { name: "publications" } },
            { label: "Áreas", to: { name: "categories" } },
            JOURNAL,
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
            {
                label: "Áreas",
                to: { name: "categories" },
                active: true,
                "aria-current": "page",
            },
            JOURNAL,
            { label: "Publicar", to: { name: "publish" } },
        ],
    },
};
