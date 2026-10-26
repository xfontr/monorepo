import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { userEvent, within } from "storybook/test";

import InterestCalculatorForm from "./InterestCalculatorForm.vue";

const meta: Meta<typeof InterestCalculatorForm> = {
    component: InterestCalculatorForm,
};

export default meta;

type Story = StoryObj<typeof InterestCalculatorForm>;

export const Empty: Story = {};

export const Invalid: Story = {
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole("button", { name: "Calcular" }));
    },
};
