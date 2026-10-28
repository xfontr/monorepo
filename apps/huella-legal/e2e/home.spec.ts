import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@monorepo/configs/playwright/test";
import { POSTS } from "./fakes.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Tailwind's `md` to `lg`, where the three-card grid drops its orphan
const TWO_COLUMNS = { from: 768, to: 1024 };

const NEWEST = [...POSTS].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
const titles = NEWEST.map(({ title }) => title.replace("&amp;", "&"));

const THESES = NEWEST.filter(({ terms }) =>
    terms.some(({ slug }) => slug === "trabajos-de-fin-de-grado"),
);

test.beforeEach(async ({ page }) => {
    const response = await page.goto("/");

    expect(response?.status()).toBe(200);
});

test("opens with the journal's statement, from the translations upstream", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Derecho riguroso, escrito para ser leído.",
    );
    await expect(page).toHaveTitle("Huella Legal");
});

test("leads with the newest post and lists the next five, without repeating it", async ({
    page,
}) => {
    const featured = page.getByRole("region", { name: "Destacado y últimas publicaciones" });

    await expect(
        featured.getByRole("article").getByRole("heading", { level: 2 }).getByRole("link"),
    ).toHaveText(titles[0]!);
    await expect(
        featured
            .getByRole("complementary", { name: "Lo último" })
            .getByRole("listitem")
            .getByRole("link"),
    ).toHaveText(titles.slice(1, 6));
});

test("follows with the three posts after those", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 0;
    const shown = width >= TWO_COLUMNS.from && width < TWO_COLUMNS.to ? 2 : 3;

    await expect(
        page
            .getByRole("region", { name: "Publicaciones recientes" })
            .getByRole("heading", { level: 3 }),
    ).toHaveText(titles.slice(6, 6 + shown));
});

test("links every subject with posts to its listing", async ({ page }) => {
    const subjects = new Set(POSTS.flatMap(({ terms }) => terms[0]?.name ?? []));

    await expect(
        page.getByRole("region", { name: "Áreas" }).getByRole("list").getByRole("link"),
    ).toHaveCount(subjects.size);
});

test("shows the newest theses and leads to the rest", async ({ page }) => {
    const band = page.getByRole("region", { name: "Trabajos de fin de grado y de máster" });

    await expect(band.getByRole("listitem")).toHaveCount(3);
    await expect(band.getByRole("listitem").first()).toContainText(
        THESES[0]!.title.replace("&amp;", "&"),
    );

    await band.getByRole("link", { name: "Ver los trabajos" }).click();

    await expect(page).toHaveURL(/\/publicaciones\/\?format=tfg-tfm$/);
});

// Every "subscribe" link in the header targets this anchor
test("ends with the newsletter band at #newsletter", async ({ page }) => {
    await expect(page.locator("#newsletter")).toHaveAccessibleName(
        "Un correo al mes con lo que hemos publicado. Nada más.",
    );
});

test("the home page has no WCAG AA violations", async ({ page }, testInfo) => {
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    await testInfo.attach(`home-${testInfo.project.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
    });
    expect(violations).toEqual([]);
});
