/** Lower-cased and stripped of accents, so «alvaro» matches «Álvaro» and «Á» files under A. */
export const normalizeText = (text: string): string =>
    text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("es");
