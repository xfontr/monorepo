import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleProse from "./Prose.vue";

const LEAD =
    "<p>El jurado volvió a la Administración de Justicia española en 1995, y con él una pregunta que la jurisprudencia aún no ha cerrado: qué debe motivar quien no es juez.</p>";

const HTML = [
    '<h2 id="origen">Origen</h2>',
    '<p>La Constitución lo prevé en su artículo 125<sup><a id="ref-1" href="#nota-1">1</a></sup>, pero la ley orgánica tardó casi dos décadas.</p>',
    '<h2 id="motivacion">La motivación del veredicto</h2>',
    "<p>El Tribunal Supremo exige una motivación <em>sucinta</em>, suficiente para que se entienda el porqué de la decisión.</p>",
    "<blockquote><p>No se pide al jurado que razone como un tribunal técnico.</p></blockquote>",
].join("");

const IMAGE = {
    id: "1",
    url: `data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect width='16' height='9' fill='slategray'/></svg>")}`,
    alt: "Sala de vistas de una Audiencia Provincial",
    width: 1200,
    height: 675,
};

const meta: Meta<typeof ArticleProse> = {
    component: ArticleProse,
    args: { lead: LEAD, html: HTML, image: IMAGE },
};

export default meta;

type Story = StoryObj<typeof ArticleProse>;

export const WithImage: Story = {};

export const NoImage: Story = { args: { image: undefined } };
