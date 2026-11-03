import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { userEvent, within } from "storybook/test";

import InterestCalculatorAdvancedForm from "./InterestCalculatorAdvancedForm.vue";

const meta: Meta<typeof InterestCalculatorAdvancedForm> = {
    component: InterestCalculatorAdvancedForm,
};

export default meta;

type Story = StoryObj<typeof InterestCalculatorAdvancedForm>;

export const Empty: Story = {};

export const Invalid: Story = {
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole("button", { name: "Calcular" }));
    },
};

export const Custom: Story = {
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole("radio", { name: "Personalizado" }));
    },
};
