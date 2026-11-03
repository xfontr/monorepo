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
        const panel = within(within(canvasElement).getByRole("tabpanel"));

        await userEvent.type(panel.getByLabelText("Fecha inicial"), "2026-01-01");
        await userEvent.type(panel.getByLabelText("Fecha final"), "2027-01-01");
        await userEvent.type(panel.getByLabelText("Importe"), "1000");
        await userEvent.click(panel.getByRole("button", { name: "Calcular" }));
    },
};

export const Advanced: Story = {
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole("tab", { name: "Avanzada" }));
    },
};
