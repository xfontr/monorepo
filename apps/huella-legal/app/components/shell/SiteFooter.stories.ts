import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SiteFooter from "./SiteFooter.vue";

const meta: Meta<typeof SiteFooter> = {
    component: SiteFooter,
    args: {
        issn: "2696-7618",
        columns: [
            {
                label: "Revista",
                children: [
                    { label: "Publicaciones", to: { name: "publications" } },
                    { label: "Materias", to: { name: "categories" } },
                    { label: "Colaboradores", to: { name: "authors" } },
                ],
            },
            {
                label: "Participa",
                children: [
                    { label: "Publicar un artículo", to: { name: "publish" } },
                    { label: "Publicar un TFG o TFM", to: { name: "publish", hash: "#tesis" } },
                ],
            },
            {
                label: "Legal",
                children: [
                    {
                        label: "Aviso legal",
                        to: { name: "article", params: { slug: "aviso-legal" } },
                    },
                ],
            },
        ],
        social: [],
    },
};

export default meta;

type Story = StoryObj<typeof SiteFooter>;

export const Default: Story = {};

export const WithSocial: Story = {
    args: {
        social: [
            {
                key: "instagram",
                icon: "i-lucide-instagram",
                to: "https://instagram.test/huella",
                label: "Instagram (se abre en una pestaña nueva)",
            },
            {
                key: "x",
                icon: "i-lucide-twitter",
                to: "https://x.test/huella",
                label: "X (se abre en una pestaña nueva)",
            },
        ],
    },
};
