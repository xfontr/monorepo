import type { Meta, StoryObj } from "@storybook/vue3-vite";

import DirectoryListing from "./Listing.vue";

const NAMES = [
    "María José Fernández",
    "Álvaro Núñez",
    "Lucía Martín",
    "Javier Crespo",
    "Ana de la Torre",
    "Pablo Ruiz",
    "Carmen Ortega",
    "Diego Herrera",
    "Elena Navarro",
    "Sergio Molina",
    "Laura Castillo",
    "Andrés Romero",
    "Irene Vidal",
    "Tomás Prieto",
];

const meta: Meta<typeof DirectoryListing> = {
    component: DirectoryListing,
    args: {
        authors: NAMES.map((name, index) => ({
            value: {
                id: String(index),
                slug: `autor-${index}`,
                name,
                bio:
                    index % 3 === 0
                        ? undefined
                        : "Abogada y profesora asociada. Escribe sobre contratos y responsabilidad civil.",
            },
            count: NAMES.length - index,
        })),
    },
};

export default meta;

type Story = StoryObj<typeof DirectoryListing>;

export const Default: Story = {};

export const FitsOnePage: Story = {
    args: { authors: meta.args!.authors!.slice(0, 5) },
};
