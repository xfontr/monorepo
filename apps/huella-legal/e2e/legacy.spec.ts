import { expect, test } from "@monorepo/configs/playwright/test";
import { AUTHOR, SOUGHT, SUBJECT, TAG } from "./fakes.ts";

const THESES = "/publicar-mi-articulo/publicar-tfm-tfg-derecho/";

// One old WordPress URL per family that has to survive the move to the same domain
const MOVED: [from: string, to: string][] = [
    ["/categorias/", "/areas/"],
    [`/Categoria/${SUBJECT.slug}/`, `/areas/${SUBJECT.slug}/`],
    [`/Etiqueta/${TAG.slug}/`, `/etiquetas/${TAG.slug}/`],
    [`/author/${AUTHOR.slug}/`, `/colaboradores/${AUTHOR.slug}/`],
    ["/publicar-mi-articulo/", "/publicar/"],
    [THESES, "/publicar/"],
    ["/noticias/", "/publicaciones/"],
    ["/page/3/", "/publicaciones/"],
    ["/comments/feed/", "/feed/"],
    ["/sitemap_index.xml", "/sitemap.xml"],
    ["/post-sitemap.xml", "/sitemap.xml"],
    [`/?s=${SOUGHT}`, `/buscar/?query=${SOUGHT}`],
];

for (const [from, to] of MOVED) {
    test(`moves ${from} permanently to ${to}, which answers`, async ({ request, baseURL }) => {
        const response = await request.get(from, { maxRedirects: 0 });

        expect(response.status()).toBe(301);
        expect(new URL(response.headers().location ?? "", baseURL).href).toBe(
            new URL(to, baseURL).href,
        );
        expect((await request.get(to)).status()).toBe(200);
    });
}

test("moves the theses list to its tag, whatever WordPress has tagged", async ({
    request,
    baseURL,
}) => {
    const response = await request.get(`${THESES}trabajos-de-fin-de-grado-y-master-publicados/`, {
        maxRedirects: 0,
    });

    expect(response.status()).toBe(301);
    expect(new URL(response.headers().location ?? "", baseURL).pathname).toBe(
        "/etiquetas/trabajos-de-fin-de-grado/",
    );
});

test("sends an old upload to WordPress's own host", async ({ request }) => {
    const path = "/wp-content/uploads/2021/03/foto.jpg";
    const response = await request.get(path, { maxRedirects: 0 });

    expect(response.status()).toBe(301);
    expect(response.headers().location).toBe(`http://localhost/wordpress${path}`);
});
