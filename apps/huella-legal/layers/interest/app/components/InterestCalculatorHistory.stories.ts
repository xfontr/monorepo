import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { calculateInterest } from "../utils/interest";
import InterestCalculatorHistory from "./InterestCalculatorHistory.vue";

const meta: Meta<typeof InterestCalculatorHistory> = {
    component: InterestCalculatorHistory,
};

export default meta;

type Story = StoryObj<typeof InterestCalculatorHistory>;

const MONTHS = ["enero", "febrero", "marzo"];

export const Empty: Story = {
    args: { entries: [] },
};

export const Rows: Story = {
    args: {
        entries: MONTHS.map((month, index) => {
            const input = {
                principal: 300,
                ratePercent: 3,
                from: `2017-0${index + 1}-07`,
                to: "2026-01-01",
            };

            return {
                ...input,
                ...calculateInterest(input),
                id: month,
                concept: `Pensión de alimentos, ${month} de 2017`,
            };
        }),
    },
};
