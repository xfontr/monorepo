import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked } from "storybook/test";

import { contactIn, type ContactStatus } from "../composables/__mocks__/useContact";
import { useContact } from "../composables/useContact";
import ContactForm from "./ContactForm.vue";

const meta: Meta<typeof ContactForm> = {
    component: ContactForm,
};

export default meta;

type Story = StoryObj<typeof ContactForm>;

const holding = (status: ContactStatus): Story => ({
    beforeEach: () => {
        mocked(useContact).mockImplementation(() => contactIn(status));
    },
});

export const Idle: Story = {};

export const Submitting: Story = holding("submitting");

// Field errors only reach the fields through a submit, which an empty form fails before any request
export const Invalid: Story = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole("button", { name: "Enviar mensaje" }));

        await expect(canvas.getByRole("textbox", { name: /Correo electrónico/ })).toHaveAttribute(
            "aria-invalid",
            "true",
        );
    },
};

export const Failed: Story = holding("error");

export const Success: Story = holding("success");
