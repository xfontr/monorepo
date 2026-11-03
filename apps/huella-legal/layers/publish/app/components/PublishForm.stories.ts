import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked } from "storybook/test";

import type { FormPostStatus } from "#layers/forms/app/composables/useFormPost";
import { submissionIn } from "../composables/__mocks__/useSubmission";
import { useSubmission } from "../composables/useSubmission";
import PublishForm from "./PublishForm.vue";

const meta: Meta<typeof PublishForm> = {
    component: PublishForm,
};

export default meta;

type Story = StoryObj<typeof PublishForm>;

const holding = (status: FormPostStatus): Story => ({
    beforeEach: () => {
        mocked(useSubmission).mockImplementation(() => submissionIn(status));
    },
});

export const Idle: Story = {};

export const Submitting: Story = holding("submitting");

// Field errors only reach the fields through a submit, which an empty form fails before any request
export const Invalid: Story = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole("button", { name: "Enviar propuesta" }));

        await expect(canvas.getByRole("textbox", { name: /Resumen/ })).toHaveAttribute(
            "aria-invalid",
            "true",
        );
    },
};

export const Failed: Story = holding("error");

export const Success: Story = holding("success");
