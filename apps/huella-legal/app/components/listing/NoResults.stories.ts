import type { Meta, StoryObj } from "@storybook/vue3-vite";

import NoResults from "./NoResults.vue";

const SUBJECTS = [
    { label: "Derecho penal", to: "#" },
    { label: "Derecho civil", to: "#" },
    { label: "Derecho constitucional", to: "#" },
    { label: "Teoría del Derecho", to: "#" },
];

const meta: Meta<typeof NoResults> = {
    component: NoResults,
    args: { query: "kardashov", subjects: SUBJECTS },
};

export default meta;

type Story = StoryObj<typeof NoResults>;

export const Default: Story = {};

export const WithSuggestion: Story = { args: { suggestion: { label: "Kardashev", to: "#" } } };

export const NoSubjects: Story = { args: { subjects: [] } };
