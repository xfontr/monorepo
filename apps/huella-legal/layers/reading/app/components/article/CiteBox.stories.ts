import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleCiteBox from "./CiteBox.vue";

const APA = {
    style: "APA 7",
    text: "Gil, M. (2024, 12 de marzo). La teoría jurídica del delito. Huella Legal. huellalegal.test/la-teoria-juridica-del-delito",
};
const HOUSE = {
    style: "Huella Legal",
    text: "GIL, M., «La teoría jurídica del delito», Huella Legal, 12 de marzo de 2024. Disponible en: huellalegal.test/la-teoria-juridica-del-delito",
};

const meta: Meta<typeof ArticleCiteBox> = {
    component: ArticleCiteBox,
    args: { citations: [APA, HOUSE] },
};

export default meta;

type Story = StoryObj<typeof ArticleCiteBox>;

export const TwoStyles: Story = {};

export const OneStyle: Story = { args: { citations: [APA] } };
