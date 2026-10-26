import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { userEvent, within } from "storybook/test";

import InterestCalculator from "./InterestCalculator.vue";

const meta: Meta<typeof InterestCalculator> = {
    component: InterestCalculator,
};

export default meta;

type Story = StoryObj<typeof InterestCalculator>;

export const Empty: Story = {};

export const Invalid: Story = {
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole("button", { name: "Calcular" }));
    },
};

export const Result: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.type(canvas.getByLabelText("Capital"), "1000");
        await userEvent.type(canvas.getByLabelText("Fecha de inicio"), "2026-01-01");
        await userEvent.type(canvas.getByLabelText("Fecha final"), "2027-01-01");
        await userEvent.click(canvas.getByRole("button", { name: "Calcular" }));
    },
};
