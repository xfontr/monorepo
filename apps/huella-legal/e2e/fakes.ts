import { readFileSync } from "node:fs";
import type { Author, Entry, Term } from "@monorepo/content";
import type { WordpressContent } from "@monorepo/content/testing";
import type { Locale, TranslationMap } from "@monorepo/i18n";

const LOCALES = new URL("../../../infrastructure/translations/projects/huella-legal/", import.meta.url);

const CIVIL: Term = { id: "11", resource: "categories", slug: "derecho-civil", name: "Derecho civil" };
const LABOUR: Term = { id: "12", resource: "categories", slug: "laboral", name: "Laboral" };

const AUTHORS: Author[] = [
    { id: "51", slug: "irene-valdes", name: "Irene Valdés Soto", bio: "Abogada civilista inventada." },
    { id: "52", slug: "tomas-arriaga", name: "Tomás Arriaga Pou" },
];

// A 1×1 GIF inline, so a cover never sends the browser to a host that isn't there
const COVER = { id: "31", url: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", alt: "Portada", width: 1200, height: 630 };

const TITLES = [
    "El contrato de arras, explicado",
    "Prescripción y caducidad: la diferencia que importa",
    "Qué cubre la legítima &amp; qué no",
    "El despido objetivo en cinco preguntas",
    "La prueba ilícita en el proceso penal",
    "Custodia compartida: criterios recientes",
    "La cláusula penal en los arrendamientos",
    "Horas extra y registro de jornada",
];

const POSTS: Entry[] = TITLES.map((title, index) => ({
    id: String(101 + index),
    slug: `articulo-${101 + index}`,
    title,
    excerpt: { format: "html", value: "<p>Un resumen inventado.</p>" },
    body: { format: "html", value: "<p>Texto de ejemplo.</p><h2>Planteamiento</h2><p>Un párrafo.</p>" },
    publishedAt: `2026-02-${String(28 - index).padStart(2, "0")}T09:00:00Z`,
    image: index % 2 === 0 ? COVER : undefined,
    terms: [index % 2 === 0 ? CIVIL : LABOUR],
    authors: index % 3 === 0 ? AUTHORS : [AUTHORS[index % 2] as Author],
}));

function locale(code: string): TranslationMap {
    return JSON.parse(readFileSync(new URL(`${code}.json`, LOCALES), "utf8")) as TranslationMap;
}

export const CONTENT: WordpressContent = { posts: POSTS, categories: [CIVIL, LABOUR] };

export const TRANSLATIONS: Record<Locale, TranslationMap> = { "es-ES": locale("es-ES") };
