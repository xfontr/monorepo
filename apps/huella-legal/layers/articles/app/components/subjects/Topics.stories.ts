import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SubjectsTopics from "./Topics.vue";

const NAMES = [
    "Abogacía",
    "Árbitros",
    "Compliance",
    "Consentimiento",
    "Dolo",
    "Jurisprudencia",
    "Libertad de expresión",
    "Prescripción",
];

const meta: Meta<typeof SubjectsTopics> = {
    component: SubjectsTopics,
    args: {
        topics: NAMES.map((name, index) => ({
            value: { id: String(index), slug: `tema-${index}`, name },
            count: (index % 4) + 1,
        })),
    },
};

export default meta;

type Story = StoryObj<typeof SubjectsTopics>;

export const Default: Story = {};
