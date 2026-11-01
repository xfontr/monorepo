import { expect, test } from "@monorepo/configs/playwright/test";
import { ARTICLE, HIDDEN, LEGAL, TAG } from "./fakes.ts";

const PATH = `/${ARTICLE.slug}/`;

test("canonicalises a post to its slug with the trailing slash, however it was requested", async ({
    page,
    baseURL,
}) => {
    const canonical = new URL(PATH, baseURL).href;

    for (const path of [PATH, `/${ARTICLE.slug}`]) {
        await page.goto(path);

        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
    }
});

test("canonicalises a WordPress page and an app page to their own paths", async ({
    page,
    baseURL,
}) => {
    for (const path of [`/${LEGAL.slug}/`, `/${LEGAL.slug.toUpperCase()}/`, "/sobre/", "/"]) {
        await page.goto(path);

        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
            "href",
            new URL(path.toLowerCase(), baseURL).href,
        );
    }
});

test("keeps the page number in a listing's canonical and drops the sort", async ({
    page,
    baseURL,
}) => {
    await page.goto("/publicaciones/?page=2&sort=oldest");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new URL("/publicaciones/?page=2", baseURL).href,
    );
});

test("signs a title with the site name once, and leaves the home page's as the bare name", async ({
    page,
}) => {
    await page.goto("/sobre/");
    await expect(page).toHaveTitle(/ - Huella Legal$/);

    await page.goto(PATH);
    await expect(page).toHaveTitle(/ - Huella Legal$/);
    await expect(page).not.toHaveTitle(/Huella Legal.* - Huella Legal$/);

    await page.goto("/");
    await expect(page).toHaveTitle("Huella Legal");
});

test("tells Google Scholar every author of an article, and describes it as a ScholarlyArticle", async ({
    page,
}) => {
    await page.goto(PATH);

    await expect(page.locator('meta[name="citation_author"]')).toHaveCount(ARTICLE.authors.length);
    await expect(page.locator('meta[name="citation_issn"]')).toHaveAttribute(
        "content",
        "2696-7618",
    );

    const { "@graph": graph } = JSON.parse(
        (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
    ) as { "@graph": { "@type": string | string[]; "@id": string; issn?: string }[] };
    const article = graph.find(({ "@type": type }) => [type].flat().includes("ScholarlyArticle"));
    const periodical = graph.find(({ "@type": type }) => type === "Periodical");

    expect(article).toMatchObject({ isPartOf: { "@id": periodical?.["@id"] } });
    expect(periodical?.issn).toBe("2696-7618");
});

test("hands reference managers the article on screen after navigating to it in the app", async ({
    page,
}) => {
    await page.goto(PATH);

    const link = page
        .getByRole("region", { name: `También en ${ARTICLE.terms[0]?.name}` })
        .getByRole("listitem")
        .first()
        .getByRole("heading")
        .getByRole("link");
    const title = (await link.textContent())?.trim() ?? "";

    await link.click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator('meta[name="citation_title"]')).toHaveAttribute("content", title);
    await expect(page.locator('meta[name="citation_author"]')).not.toHaveCount(0);
    await expect(page.locator('meta[name="citation_author"]')).not.toHaveCount(
        ARTICLE.authors.length * 2,
    );
});

test("keeps a post the CMS marks noindex, and every tag archive, out of search", async ({
    page,
}) => {
    for (const path of [`/${HIDDEN.slug}/`, `/etiquetas/${TAG.slug}/`, "/buscar/"]) {
        await page.goto(path);

        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^noindex/);
    }

    await page.goto(PATH);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index/);
});

test("lists indexable posts in the sitemap, and leaves noindex ones out", async ({
    request,
    baseURL,
}) => {
    const response = await request.get("/sitemap.xml");
    const sitemap = await response.text();

    expect(response.headers()["content-type"]).toContain("xml");
    expect(sitemap).toContain(`<loc>${new URL(PATH, baseURL).href}</loc>`);
    expect(sitemap).toContain(`<loc>${new URL("/sobre/", baseURL).href}</loc>`);
    expect(sitemap).not.toContain(`/${HIDDEN.slug}/`);
    expect(sitemap).not.toMatch(/\/(?:etiquetas|buscar|lab)\//);
});

test("allows crawlers on the canonical host and points them at the sitemap", async ({
    request,
    baseURL,
}) => {
    const robots = await (await request.get("/robots.txt")).text();

    expect(robots).not.toMatch(/^Disallow: \/$/m);
    expect(robots).toContain(`Sitemap: ${new URL("/sitemap.xml", baseURL).href}`);
});

test("serves the RSS feed at /feed/, the address WordPress's readers subscribed to", async ({
    request,
}) => {
    for (const path of ["/feed/", "/feed"]) {
        const response = await request.get(path);

        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("application/rss+xml");
        expect(await response.text()).toContain("<item>");
    }
});
