import type { Meta, StoryObj } from "@storybook/vue3-vite";

import Byline from "./Byline.vue";

const MARIA = { id: "1", name: "María José Fernández de la Vega", to: "#" };
const LUIS = { id: "2", name: "Luis Martín Ortega", to: "#" };
const MARTA = { id: "3", name: "Marta Gil" };

const meta: Meta<typeof Byline> = {
    component: Byline,
    args: { authors: [MARIA], publishedAt: "2024-03-12T09:00:00Z", readingMinutes: 14 },
};

export default meta;

type Story = StoryObj<typeof Byline>;

export const SingleAuthor: Story = {};

export const SeveralAuthors: Story = { args: { authors: [MARIA, LUIS, MARTA] } };

export const WithAvatars: Story = { args: { authors: [MARIA, LUIS, MARTA], avatars: true } };

export const OneMinuteRead: Story = { args: { readingMinutes: 1 } };

export const NamesOnly: Story = { args: { authors: [MARIA, LUIS], publishedAt: undefined, readingMinutes: undefined } };
