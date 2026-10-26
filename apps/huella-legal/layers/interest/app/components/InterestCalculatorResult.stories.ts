import type { Meta, StoryObj } from "@storybook/vue3-vite";

import InterestCalculatorResult from "./InterestCalculatorResult.vue";

const meta: Meta<typeof InterestCalculatorResult> = {
    component: InterestCalculatorResult,
};

export default meta;

type Story = StoryObj<typeof InterestCalculatorResult>;

export const Empty: Story = {};

export const Result: Story = {
    args: { result: { days: 365, interestCents: 3250, totalCents: 103_250 } },
};
