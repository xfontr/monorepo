import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked } from "storybook/test";

import type { FormPostStatus } from "#layers/forms/app/composables/useFormPost";
import { newsletterIn } from "../composables/__mocks__/useNewsletter";
import { useNewsletter } from "../composables/useNewsletter";
import NewsletterForm from "./NewsletterForm.vue";

const meta: Meta<typeof NewsletterForm> = {
    component: NewsletterForm,
};

export default meta;

type Story = StoryObj<typeof NewsletterForm>;

const holding = (status: FormPostStatus): Story => ({
    beforeEach: () => {
        mocked(useNewsletter).mockImplementation(() => newsletterIn(status));
    },
});

export const Stacked: Story = {};

export const Inline: Story = { args: { layout: "inline" } };

export const Submitting: Story = holding("submitting");

// Field errors only reach the field through a submit, which the address fails before any request
export const Invalid: Story = {
    play: async ({ canvas, userEvent }) => {
        const email = canvas.getByRole("textbox", { name: "Correo electrónico" });

        await userEvent.type(email, "lucia@");
        await userEvent.click(canvas.getByRole("button", { name: "Suscribirme" }));

        await expect(email).toHaveAttribute("aria-invalid", "true");
    },
};

export const Failed: Story = holding("error");

export const Success: Story = holding("success");
