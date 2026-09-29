// Fixtures for the B variants, which split the eleven A "materias" into separate axes: subject,
// subtopic, format, series and tag. The Fundamentos titles are real, but their dates, numbers and
// credit to Xifré Font are placeholders; every other entry by a real name is one already in
// fixtures.ts, and the rest are invented and credited to invented people.

import { articles, author, authors, tags, type LabArticle } from "./fixtures";

export type FormatSlug = "articulo" | "comentario" | "ensayo" | "tfg-tfm";

export interface LabFormat {
    slug: FormatSlug
    name: string
    plural: string
    description: string
}

export interface LabSubject {
    slug: string
    name: string
    description: string
    subtopics: string[]
}

export interface LabSeries {
    slug: string
    name: string
    subject: string
    description: string
}

export interface ArchiveEntry extends LabArticle {
    subject: string
    subtopic: string
    format: FormatSlug
    tags: string[]
    year: number
    words: number
    series?: { slug: string, position: number }
}

export const formats: LabFormat[] = [
    { slug: "articulo", name: "Artículo", plural: "Artículos", description: "Análisis doctrinal completo, con notas y bibliografía." },
    { slug: "comentario", name: "Comentario", plural: "Comentarios", description: "Lectura crítica de una sentencia o de una reforma concreta." },
    { slug: "ensayo", name: "Ensayo", plural: "Ensayos", description: "Opinión y reflexión con base doctrinal." },
    { slug: "tfg-tfm", name: "TFG o TFM", plural: "TFG y TFM", description: "Trabajos de fin de grado y de máster, publicados íntegramente." },
];

export const subjects: LabSubject[] = [
    { slug: "derecho-penal", name: "Derecho penal", description: "Dogmática, teoría del delito, política criminal y análisis de reformas del Código Penal.", subtopics: ["Teoría del delito", "Parte especial", "Política criminal", "Proceso penal"] },
    { slug: "derechos-fundamentales", name: "Derechos fundamentales", description: "Garantías constitucionales, jurisprudencia del Tribunal Constitucional y del TEDH.", subtopics: ["Tribunal Constitucional", "TEDH", "Jurisprudencia comparada"] },
    { slug: "derecho-civil", name: "Derecho civil", description: "Familia, contratos, sucesiones y los problemas nuevos del bioderecho.", subtopics: ["Familia y sucesiones", "Contratos", "Bioderecho"] },
    { slug: "derecho-mercantil", name: "Derecho mercantil", description: "Sociedades, contratos mercantiles, concursal y competencia.", subtopics: ["Sociedades", "Concursal"] },
    { slug: "derecho-laboral", name: "Derecho laboral", description: "Relaciones laborales, Seguridad Social y reformas del Estatuto de los Trabajadores.", subtopics: ["Despido", "Trabajo a distancia"] },
    { slug: "derecho-tecnologico", name: "Derecho tecnológico", description: "Protección de datos, inteligencia artificial, plataformas y ciberdelincuencia.", subtopics: ["Protección de datos", "Inteligencia artificial", "Derecho digital y garantías constitucionales"] },
    { slug: "tributario-y-financiero", name: "Tributario y financiero", description: "Fiscalidad, procedimiento tributario y Derecho financiero público.", subtopics: ["Fiscalidad"] },
    { slug: "teoria-del-derecho", name: "Teoría del Derecho", description: "Filosofía jurídica, iusnaturalismo, positivismo y teoría de la norma.", subtopics: ["Filosofía del Derecho", "Derechos humanos"] },
    { slug: "abogacia", name: "Abogacía", description: "Ejercicio profesional, deontología y acceso a la profesión.", subtopics: ["Deontología", "Acceso a la profesión"] },
];

export const series: LabSeries[] = [
    {
        slug: "fundamentos",
        name: "Fundamentos del Derecho penal",
        subject: "derecho-penal",
        description: "Cinco lecturas, en orden, para entender cómo razona un penalista: qué es el Derecho penal, cómo se construye el delito y qué escuelas lo han pensado.",
    },
];

const invented = {
    ines: author("Inés Barroso Llamas", "Abogada mercantilista", "Asesora a pequeñas sociedades en conflictos entre socios y en reestructuraciones.", 3),
    tomas: author("Tomás Ibarra Quintero", "Graduado social", undefined, 3),
    nuria: author("Nuria Echevarría Solís", "Investigadora predoctoral", "Prepara una tesis sobre positivismo jurídico y razonamiento judicial.", 3),
};

const [teoria, kardashev, jurado, fecundacion, siEsSi, pogonza, plataformas] = articles as [LabArticle, LabArticle, LabArticle, LabArticle, LabArticle, LabArticle, LabArticle];

const entry = (base: LabArticle, extra: Omit<ArchiveEntry, keyof LabArticle | "year">): ArchiveEntry => ({
    ...base,
    ...extra,
    category: subjects.find((item) => item.slug === extra.subject)!.name,
    year: Number(base.date.slice(-4)),
});

const own = (slug: string, title: string, excerpt: string, by: LabArticle["authors"], date: string, issue: string, words: number): LabArticle =>
    ({ slug, title, excerpt, authors: by, date, issue, category: "", readingMinutes: Math.round(words / 250) });

export const archive: ArchiveEntry[] = [
    entry(own("delitos-de-odio", "Delitos de odio en redes sociales: el artículo 510 ante el discurso anónimo", "Cómo encaja la incitación al odio difundida desde perfiles anónimos en un tipo pensado para la imprenta.", [authors.lucia], "18 de julio de 2024", "Nº 09/24", 9800), { subject: "derecho-penal", subtopic: "Parte especial", format: "tfg-tfm", tags: ["Reforma legislativa", "Jurisprudencia"], words: 9800 }),
    entry(own("impuesto-grandes-fortunas", "El impuesto sobre grandes fortunas ante el Tribunal Constitucional", "La sentencia que avaló el impuesto temporal de solidaridad y lo que deja abierto sobre la armonización autonómica.", [invented.ines], "4 de junio de 2024", "Nº 08/24", 3900), { subject: "tributario-y-financiero", subtopic: "Fiscalidad", format: "comentario", tags: ["Jurisprudencia"], words: 3900 }),
    entry(own("algoritmos-libertad-condicional", "Algoritmos de riesgo en la libertad condicional: ¿quién decide?", "Las herramientas de predicción de reincidencia prometen objetividad. El problema es que nadie puede discutir su razonamiento.", [authors.lucia], "22 de mayo de 2024", "Nº 07/24", 3100), { subject: "derecho-penal", subtopic: "Política criminal", format: "ensayo", tags: ["Inteligencia artificial", "Dogmática penal"], words: 3100 }),
    entry(own("stc-76-2019", "La STC 76/2019 y los datos de opinión política", "El Tribunal Constitucional anuló la recogida de opiniones políticas por los partidos. Qué exige la sentencia a cualquier ley futura.", [authors.alejandro], "9 de abril de 2024", "Nº 06/24", 4400), { subject: "derechos-fundamentales", subtopic: "Tribunal Constitucional", format: "comentario", tags: ["Protección de datos", "Derecho constitucional", "Jurisprudencia"], words: 4400 }),
    entry(own("derecho-al-olvido", "El derecho al olvido, diez años después de Google Spain", "Del caso Costeja al artículo 17 del RGPD: cómo ha aplicado la jurisprudencia europea un derecho que nació en una sentencia.", [authors.mariaJose], "21 de marzo de 2024", "Nº 05/24", 7100), { subject: "derecho-tecnologico", subtopic: "Protección de datos", format: "articulo", tags: ["Protección de datos", "Jurisprudencia", "Derecho comparado"], words: 7100 }),
    entry(teoria, { subject: "derecho-penal", subtopic: "Teoría del delito", format: "articulo", tags: ["Dogmática penal", "Teoría del delito"], words: 6000, series: { slug: "fundamentos", position: 2 } }),
    entry(plataformas, { subject: "derecho-tecnologico", subtopic: "Derecho digital y garantías constitucionales", format: "articulo", tags: ["Inteligencia artificial", "Protección de datos", "Derecho constitucional"], words: 8000 }),
    entry(own("ia-y-autoria", "Inteligencia artificial y autoría: ¿puede una máquina crear?", "La propiedad intelectual exige un autor humano. Qué ocurre con las obras que ya no lo tienen.", [authors.lucia], "14 de noviembre de 2023", "Nº 25/23", 2800), { subject: "derecho-tecnologico", subtopic: "Inteligencia artificial", format: "ensayo", tags: ["Inteligencia artificial"], words: 2800 }),
    entry(own("despido-absentismo", "El despido por absentismo tras su derogación", "Tres años después de la reforma, los tribunales siguen resolviendo casos anteriores. Qué criterio se ha impuesto.", [invented.tomas], "26 de octubre de 2023", "Nº 24/23", 3300), { subject: "derecho-laboral", subtopic: "Despido", format: "comentario", tags: ["Reforma legislativa", "Jurisprudencia"], words: 3300 }),
    entry(kardashev, { subject: "teoria-del-derecho", subtopic: "Derechos humanos", format: "ensayo", tags: ["Filosofía del Derecho"], words: 3500 }),
    entry(jurado, { subject: "derecho-penal", subtopic: "Proceso penal", format: "ensayo", tags: ["Jurado"], words: 2800 }),
    entry(fecundacion, { subject: "derecho-civil", subtopic: "Bioderecho", format: "tfg-tfm", tags: ["Bioética", "Derecho comparado"], words: 4200 }),
    entry(siEsSi, { subject: "derecho-penal", subtopic: "Parte especial", format: "comentario", tags: ["Violencia de género", "Reforma legislativa"], words: 4700 }),
    entry(pogonza, { subject: "derechos-fundamentales", subtopic: "Jurisprudencia comparada", format: "comentario", tags: ["Derecho constitucional", "Jurisprudencia"], words: 2200 }),
    entry(own("segunda-oportunidad", "La segunda oportunidad: exoneración del pasivo insatisfecho", "Qué cambió la reforma concursal de 2022 para el deudor persona física, y qué sigue sin resolver.", [invented.tomas], "12 de julio de 2023", "Nº 17/23", 5200), { subject: "derecho-mercantil", subtopic: "Concursal", format: "articulo", tags: ["Reforma legislativa"], words: 5200 }),
    entry(own("administradores-sl", "Responsabilidad de los administradores en la sociedad limitada", "Trabajo de fin de máster sobre la acción social e individual de responsabilidad y su uso real en los tribunales.", [invented.ines], "3 de mayo de 2023", "Nº 12/23", 11200), { subject: "derecho-mercantil", subtopic: "Sociedades", format: "tfg-tfm", tags: ["Jurisprudencia"], words: 11200 }),
    entry(own("teletrabajo-desconexion", "Teletrabajo y derecho a la desconexión digital", "Trabajo de fin de grado sobre la Ley 10/2021 y la negociación colectiva que debía desarrollarla.", [invented.nuria], "15 de diciembre de 2022", "Nº 26/22", 10400), { subject: "derecho-laboral", subtopic: "Trabajo a distancia", format: "tfg-tfm", tags: ["Reforma legislativa"], words: 10400 }),
    entry(own("gestacion-subrogada", "Gestación subrogada y orden público internacional", "La inscripción de filiaciones constituidas en el extranjero, entre la Dirección General y el Tribunal Supremo.", [invented.nuria], "2 de noviembre de 2022", "Nº 23/22", 9600), { subject: "derecho-civil", subtopic: "Familia y sucesiones", format: "tfg-tfm", tags: ["Bioética", "Derecho comparado"], words: 9600 }),
    entry(own("escuela-positiva", "La Escuela Positiva penal", "El delito como hecho determinado por factores biológicos y sociales.", [authors.xifre], "20 de octubre de 2022", "Nº 21/22", 4100), { subject: "derecho-penal", subtopic: "Teoría del delito", format: "articulo", tags: ["Dogmática penal", "Filosofía del Derecho"], words: 4100, series: { slug: "fundamentos", position: 5 } }),
    entry(own("positivismo-incluyente", "Positivismo incluyente y excluyente: un mapa", "Hart, Raz y Waluchow en veinte páginas, para quien necesita orientarse antes de leerlos.", [invented.nuria], "7 de septiembre de 2022", "Nº 19/22", 6300), { subject: "teoria-del-derecho", subtopic: "Filosofía del Derecho", format: "articulo", tags: ["Filosofía del Derecho"], words: 6300 }),
    entry(own("prision-permanente", "La prisión permanente revisable, a examen", "Trabajo de fin de grado sobre la pena más grave del Código y su encaje con la reinserción.", [authors.lucia], "13 de julio de 2022", "Nº 15/22", 12800), { subject: "derecho-penal", subtopic: "Política criminal", format: "tfg-tfm", tags: ["Dogmática penal", "Reforma legislativa"], words: 12800 }),
    entry(own("funcionalismo-penal", "El funcionalismo penal", "El Derecho penal orientado al mantenimiento de las expectativas.", [authors.xifre], "8 de junio de 2022", "Nº 12/22", 4600), { subject: "derecho-penal", subtopic: "Teoría del delito", format: "articulo", tags: ["Dogmática penal", "Teoría del delito"], words: 4600, series: { slug: "fundamentos", position: 4 } }),
    entry(own("secreto-profesional", "El secreto profesional del abogado ante la inspección", "Hasta dónde puede entrar la Administración en un despacho, y qué documentos quedan fuera.", [authors.alejandro], "11 de mayo de 2022", "Nº 10/22", 3700), { subject: "abogacia", subtopic: "Deontología", format: "articulo", tags: ["Jurisprudencia"], words: 3700 }),
    entry(own("finalismo-causalismo", "Las teorías del finalismo y el causalismo penal", "La noción de acción como punto de partida.", [authors.xifre], "16 de febrero de 2022", "Nº 04/22", 5100), { subject: "derecho-penal", subtopic: "Teoría del delito", format: "articulo", tags: ["Dogmática penal", "Teoría del delito"], words: 5100, series: { slug: "fundamentos", position: 3 } }),
    entry(own("prueba-ilicita", "La prueba ilícita en el proceso penal", "La regla de exclusión del artículo 11 de la LOPJ y sus excepciones, de la conexión de antijuridicidad al hallazgo casual.", [authors.alejandro], "24 de noviembre de 2021", "Nº 22/21", 6800), { subject: "derecho-penal", subtopic: "Proceso penal", format: "articulo", tags: ["Jurisprudencia", "Derecho constitucional"], words: 6800 }),
    entry(own("tedh-jueces", "El TEDH y la libertad de expresión de los jueces", "De Baka contra Hungría a Żurek contra Polonia: cuándo puede un juez criticar en público al poder político.", [authors.mariaJose], "6 de octubre de 2021", "Nº 18/21", 5900), { subject: "derechos-fundamentales", subtopic: "TEDH", format: "articulo", tags: ["Derecho comparado", "Jurisprudencia"], words: 5900 }),
    entry(own("clausulas-abusivas", "Cláusulas abusivas en préstamos hipotecarios", "Trabajo de fin de grado sobre el control de transparencia desde la cláusula suelo hasta los gastos de formalización.", [authors.lucia], "9 de junio de 2021", "Nº 11/21", 10100), { subject: "derecho-civil", subtopic: "Contratos", format: "tfg-tfm", tags: ["Jurisprudencia"], words: 10100 }),
    entry(own("el-derecho-penal", "El Derecho penal", "Qué es, cuáles son sus disciplinas y sus principales escuelas de pensamiento.", [authors.xifre], "3 de marzo de 2021", "Nº 05/21", 3800), { subject: "derecho-penal", subtopic: "Teoría del delito", format: "articulo", tags: ["Dogmática penal"], words: 3800, series: { slug: "fundamentos", position: 1 } }),
    entry(own("examen-acceso", "Acceso a la abogacía: el examen de Estado en perspectiva comparada", "España llegó tarde al examen de acceso. Qué aprendió, y qué no, de Francia, Alemania e Italia.", [invented.tomas], "20 de enero de 2021", "Nº 02/21", 3000), { subject: "abogacia", subtopic: "Acceso a la profesión", format: "ensayo", tags: ["Derecho comparado"], words: 3000 }),
];

export const seriesEntries = (slug: string) => archive
    .filter((item) => item.series?.slug === slug)
    .sort((a, b) => a.series!.position - b.series!.position);

export const tagIndex = [...tags.map(([name]) => name), "Culpabilidad", "Código Penal", "Deontología", "Gestación subrogada", "Libertad de expresión", "Prisión permanente", "RGPD", "Segunda oportunidad", "Teletrabajo"]
    .sort((a, b) => a.localeCompare(b, "es"));

export const navB = [
    { label: "Publicaciones", to: "/lab/category-c" },
    { label: "Materias", to: "/lab/categorias-b" },
    { label: "Series", to: "/lab/serie-b" },
    { label: "Colaboradores", to: "/lab/colaboradores" },
    { label: "Publicar", to: "/lab/publicar" },
];
