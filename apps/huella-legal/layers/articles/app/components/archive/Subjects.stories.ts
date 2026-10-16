import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArchiveSubjects from "./Subjects.vue";

const meta: Meta<typeof ArchiveSubjects> = {
    component: ArchiveSubjects,
    args: {
        title: "Materias",
        subjects: [
            { value: { id: "1", slug: "derecho-penal", name: "Derecho penal" }, count: 12 },
            { value: { id: "2", slug: "derecho-civil", name: "Derecho civil" }, count: 8 },
            { value: { id: "3", slug: "derecho-laboral", name: "Derecho laboral" }, count: 1 },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof ArchiveSubjects>;

export const Archive: Story = {};

export const Subject: Story = {
    args: { title: "Otras materias", currentSubject: "1", archiveLink: true },
};
