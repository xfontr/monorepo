import type { Meta, StoryObj } from "@storybook/vue3-vite";

import CiteBox from "./CiteBox.vue";

const APA = { label: "APA 7", value: "Gil, M. (2024, 12 de marzo). La teoría jurídica del delito. Huella Legal. huellalegal.test/la-teoria-juridica-del-delito" };
const HOUSE = { label: "Huella Legal", value: "GIL, M., «La teoría jurídica del delito», Huella Legal, 12 de marzo de 2024. Disponible en: huellalegal.test/la-teoria-juridica-del-delito" };

const meta: Meta<typeof CiteBox> = {
    component: CiteBox,
    args: { citations: [APA, HOUSE] },
};

export default meta;

type Story = StoryObj<typeof CiteBox>;

export const TwoStyles: Story = {};

export const OneStyle: Story = { args: { citations: [APA] } };
