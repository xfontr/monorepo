// Design-lab fixtures: real titles, authors and categories from huellalegal.com plus stress cases.
// Nothing here is production data; the lab never calls @monorepo/content. Roles, bios and counts
// are placeholders attached to real names (only Raquel Crespo Ruiz's credentials are sourced).

export interface LabAuthor {
    name: string
    role?: string
    bio?: string
    initials: string
    articles?: number
}

export interface LabArticle {
    slug: string
    title: string
    excerpt?: string
    category: string
    authors: LabAuthor[]
    date: string
    readingMinutes: number
    issue?: string
    media?: "image" | "none"
}

export interface LabCategory {
    name: string
    slug: string
    description: string
    count: number
}

export const author = (name: string, role?: string, bio?: string, articles?: number): LabAuthor => ({
    name,
    role,
    bio,
    articles,
    initials: name.split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w)).slice(0, 2).map((w) => w[0]).join(""),
});

export const authors = {
    xifre: author("Xifré Font", "Fundador y editor", "Jurista especializado en Derecho penal y teoría del delito. Fundó Huella Legal en 2020 para acercar la dogmática penal a lectores no especializados sin rebajar el rigor.", 31),
    raquel: author("Raquel Crespo Ruiz", "Exfiscal y magistrada", "Veintisiete años de ejercicio en la carrera fiscal y judicial, con especial dedicación a la violencia de género y los delitos contra la libertad sexual.", 4),
    alfredo: author("Alfredo Mario Condomí", "Profesor de Filosofía del Derecho", "Docente universitario en Buenos Aires. Investiga la relación entre derechos humanos, tecnología y futuro de la especie.", 6),
    pedro: author("Pedro Miguel Mata Chacín", "Abogado", undefined, 2),
    mayra: author("Mayra Valdéz Flores", "Estudiante de Derecho, UNAM", "Investiga bioética y Derecho de familia comparado.", 1),
    agustina: author("Agustina Frattari", "Abogada constitucionalista", undefined, 3),
    // Stress cases from the retired P6 brief
    mariaJose: author("María-José Fernández Ruiz", "Profesora titular de Derecho Constitucional", "Doctora en Derecho por la Universidad Complutense de Madrid. Sus líneas de investigación abarcan la protección de datos, la inteligencia artificial y las garantías constitucionales frente a la automatización de decisiones públicas y privadas, con publicaciones en revistas nacionales e internacionales.", 9),
    alejandro: author("Alejandro de la Vega Pérez", "Letrado del Tribunal Constitucional", undefined, 2),
    lucia: author("Lucía Martín Salcedo", undefined, undefined, 1),
};

export const categories: LabCategory[] = [
    { name: "Derecho penal", slug: "derecho-penal", count: 48, description: "Dogmática, teoría del delito, política criminal y análisis de reformas del Código Penal." },
    { name: "Derechos fundamentales", slug: "derechos-fundamentales", count: 12, description: "Garantías constitucionales, jurisprudencia del Tribunal Constitucional y del TEDH." },
    { name: "Derecho civil", slug: "derecho-civil", count: 17, description: "Análisis de toda suerte de cuestiones relacionadas con el Derecho civil." },
    { name: "Derecho mercantil", slug: "derecho-mercantil", count: 8, description: "Sociedades, contratos mercantiles, concursal y competencia." },
    { name: "Derecho laboral", slug: "derecho-laboral", count: 7, description: "Relaciones laborales, Seguridad Social y reformas del Estatuto de los Trabajadores." },
    { name: "Derecho tecnológico", slug: "derecho-tecnologico", count: 11, description: "Protección de datos, inteligencia artificial, plataformas y ciberdelincuencia." },
    { name: "Tributario y financiero", slug: "tributario-y-financiero", count: 5, description: "Fiscalidad, procedimiento tributario y Derecho financiero público." },
    { name: "Teoría del Derecho", slug: "teoria-del-derecho", count: 14, description: "Filosofía jurídica, iusnaturalismo, positivismo y teoría de la norma." },
    { name: "Ensayos jurídicos", slug: "ensayos-juridicos", count: 9, description: "Textos de opinión y reflexión con base doctrinal." },
    { name: "Abogacía", slug: "abogacia", count: 6, description: "Ejercicio profesional, deontología y acceso a la profesión." },
    { name: "Trabajos TFG y TFM", slug: "trabajos-tfg-tfm", count: 22, description: "Trabajos de fin de grado y de máster publicados íntegramente." },
];

export const tags = [
    ["Dogmática penal", 14], ["Teoría del delito", 11], ["Derecho constitucional", 4], ["Violencia de género", 6],
    ["Jurado", 2], ["Bioética", 3], ["Inteligencia artificial", 5], ["Protección de datos", 4],
    ["Reforma legislativa", 9], ["Jurisprudencia", 12], ["Derecho comparado", 7], ["Filosofía del Derecho", 8],
] as const;

export const articles: LabArticle[] = [
    {
        slug: "la-teoria-juridica-del-delito",
        title: "La teoría jurídica del delito",
        excerpt: "La teoría jurídica del delito y sus categorías —tipicidad, antijuridicidad y culpabilidad— es un tema muy recurrente dentro del ámbito del Derecho penal. Una guía para entender cómo se construye.",
        category: "Derecho penal",
        authors: [authors.xifre],
        date: "12 de marzo de 2024",
        readingMinutes: 24,
        issue: "Nº 04/24",
        media: "image",
    },
    {
        slug: "kardashev",
        title: "Civilización Tipo I de Kardashev, en términos iushumanísticos",
        excerpt: "Análisis del sistema de clasificación de civilizaciones de Kardashev y de lo que implicaría para los derechos humanos.",
        category: "Teoría del Derecho",
        authors: [authors.alfredo],
        date: "7 de octubre de 2023",
        readingMinutes: 14,
        issue: "Nº 23/23",
    },
    {
        slug: "tribunal-del-jurado",
        title: "El Tribunal del Jurado: la sociedad en el Derecho",
        excerpt: "Crítica a la necesidad del Jurado Popular, como institución perjudicial para el eficiente desarrollo de la Justicia.",
        category: "Derecho penal",
        authors: [authors.pedro],
        date: "30 de septiembre de 2023",
        readingMinutes: 11,
        issue: "Nº 22/23",
    },
    {
        slug: "fecundacion-post-mortem",
        title: "Fecundación post mortem en Argentina",
        excerpt: "Análisis de los elementos a valorar con la fecundación post mortem, prestando especial atención a los principales bienes jurídicos afectados.",
        category: "Derecho civil",
        authors: [authors.mayra],
        date: "7 de septiembre de 2023",
        readingMinutes: 17,
        issue: "Nº 21/23",
        media: "image",
    },
    {
        slug: "ley-del-si-es-si",
        title: "¿Cómo desaprovechar una oportunidad? Modificación de la «Ley del sí es sí»",
        excerpt: "Análisis crítico de la modificación de la Ley Orgánica 10/2022 y de sus efectos sobre las penas ya impuestas.",
        category: "Derecho penal",
        authors: [authors.raquel],
        date: "30 de agosto de 2023",
        readingMinutes: 19,
        issue: "Nº 20/23",
    },
    {
        slug: "fallo-pogonza",
        title: "Análisis del fallo «Pogonza»",
        excerpt: "Análisis del fallo Pogonza, prestando especial atención a su relación con la Carta Magna.",
        category: "Derechos fundamentales",
        authors: [authors.agustina],
        date: "23 de agosto de 2023",
        readingMinutes: 9,
        issue: "Nº 19/23",
    },
    {
        slug: "plataformas-digitales",
        title: "La responsabilidad de las plataformas digitales ante decisiones automatizadas que afectan a derechos fundamentales",
        excerpt: "Del artículo 22 del RGPD a la Ley de Servicios Digitales: qué garantías tiene hoy un ciudadano frente a una decisión tomada por un algoritmo, y quién responde cuando falla.",
        category: "Derecho digital y garantías constitucionales",
        authors: [authors.mariaJose, authors.alejandro, authors.lucia],
        date: "2 de febrero de 2024",
        readingMinutes: 32,
        issue: "Nº 02/24",
    },
];

// The "Fundamentos" series on the current homepage
export const fundamentals: Pick<LabArticle, "title" | "excerpt" | "slug">[] = [
    { slug: "el-derecho-penal", title: "El Derecho penal", excerpt: "Qué es, cuáles son sus disciplinas y sus principales escuelas de pensamiento." },
    { slug: "la-teoria-juridica-del-delito", title: "La teoría jurídica del delito", excerpt: "Tipicidad, antijuridicidad y culpabilidad." },
    { slug: "finalismo-y-causalismo", title: "Las teorías del finalismo y el causalismo penal", excerpt: "La noción de acción como punto de partida." },
    { slug: "funcionalismo-penal", title: "El funcionalismo penal", excerpt: "El Derecho penal orientado al mantenimiento de las expectativas." },
    { slug: "escuela-positiva", title: "La Escuela Positiva penal", excerpt: "El delito como hecho determinado por factores biológicos y sociales." },
];

export const stress = {
    title: "La responsabilidad de las plataformas digitales ante decisiones automatizadas que afectan a derechos fundamentales",
    category: "Derecho digital y garantías constitucionales",
    citation: "STC 76/2019, de 22 de mayo, FJ 5; DOUE L 119, de 4 de mayo de 2016, pp. 1–88",
};

export const nav = [
    { label: "Publicaciones", to: "/lab/category" },
    { label: "Materias", to: "/lab/categorias" },
    { label: "Colaboradores", to: "/lab/colaboradores" },
    { label: "Publicar", to: "/lab/publicar" },
];

export const issn = "ISSN 2696-7618";
