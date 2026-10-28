import type { Meta, StoryObj } from "@storybook/vue3-vite";

import HomeSubjects from "./Subjects.vue";

const subject = (id: string, name: string, count: number) => ({
    value: { id, slug: `area-${id}`, name },
    count,
});

const meta: Meta<typeof HomeSubjects> = {
    component: HomeSubjects,
    args: {
        subjects: [
            subject("1", "Derecho administrativo", 8),
            subject("2", "Derecho civil", 21),
            subject("3", "Derecho constitucional", 12),
            subject("4", "Derecho internacional", 6),
            subject("5", "Derecho laboral", 4),
            subject("6", "Derecho penal", 34),
            subject("7", "Derecho procesal", 9),
            subject("8", "Ensayos", 11),
            subject("9", "Teoría del Derecho", 7),
        ],
        formats: [
            { value: "articulo", count: 90 },
            { value: "comentario", count: 14 },
            { value: "tfg-tfm", count: 8 },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof HomeSubjects>;

export const Default: Story = {};
