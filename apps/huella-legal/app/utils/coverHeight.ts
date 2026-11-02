export const coverHeight = (width: number | undefined, ratio: number): number | undefined =>
    width && Math.round(width / ratio);
