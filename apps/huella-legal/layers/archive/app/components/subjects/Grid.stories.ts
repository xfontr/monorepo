import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SubjectsGrid from "./Grid.vue";

const meta: Meta<typeof SubjectsGrid> = {
    component: SubjectsGrid,
    args: {
        subjects: [
            {
                value: {
                    id: "1",
                    slug: "derecho-penal",
                    name: "Derecho penal",
                    description:
                        "Dogmática, teoría del delito y análisis de reformas del Código Penal.",
                },
                count: 24,
            },
            {
                value: {
                    id: "2",
                    slug: "derecho-civil",
                    name: "Derecho civil",
                    description: "Personas, contratos, familia y sucesiones.",
                },
                count: 12,
            },
            { value: { id: "3", slug: "derecho-laboral", name: "Derecho laboral" }, count: 1 },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof SubjectsGrid>;

export const Default: Story = {};
