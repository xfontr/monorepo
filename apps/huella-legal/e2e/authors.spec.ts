import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@monorepo/configs/playwright/test";
import type { Page } from "@playwright/test";
import { AUTHOR, POSTS } from "./fakes.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const postsBy = (id: string) =>
    POSTS.filter(({ authors }) => authors.some((author) => author.id === id));

const RANKED = [
    ...new Map(
        POSTS.flatMap(({ authors }) => authors).map((author) => [author.id, author]),
    ).values(),
].sort(
    (a, b) => postsBy(b.id).length - postsBy(a.id).length || a.name.localeCompare(b.name, "es-ES"),
);

const AUTHOR_COUNT = RANKED.length;

const directory = (page: Page) => page.getByRole("region", { name: "Colaboradores" });

const cards = (page: Page) => directory(page).getByRole("heading", { level: 3 });

const field = (page: Page) => directory(page).getByRole("searchbox", { name: "Buscar por nombre" });

const scan = async (page: Page) =>
    (await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()).violations;

// The runner can type or click before hydration, when nothing is listening yet, so it retries
const untilHydrated = (act: () => Promise<void>, settled: () => Promise<void>) =>
    expect(async () => {
        await act();
        await settled();
    }).toPass();

test.beforeEach(async ({ page }) => {
    const response = await page.goto("/colaboradores/");

    expect(response?.status()).toBe(200);
});

test("the page opens on the journal's about, then its principles", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Una revista escrita por quienes practican, enseñan y estudian el Derecho.",
    );
    await expect(page.getByRole("main")).toContainText(`Hoy reúne a ${AUTHOR_COUNT} colaboradores`);
    await expect(
        page.getByRole("region", { name: "Principios editoriales" }).getByRole("heading"),
    ).toHaveText(["Rigor", "Accesibilidad", "Acceso libre"]);
});

test("the directory shows the twelve most published first and reveals the rest on request", async ({
    page,
}) => {
    await expect(cards(page)).toHaveText(RANKED.slice(0, 12).map(({ name }) => name));
    await expect(directory(page).getByRole("link", { name: RANKED[0]!.name })).toHaveAttribute(
        "href",
        `/colaboradores/${RANKED[0]!.slug}/`,
    );

    const more = page.getByRole("button", { name: `Mostrar los ${AUTHOR_COUNT} colaboradores` });

    await untilHydrated(
        async () => {
            if (await more.isVisible()) await more.click();
        },
        () => expect(cards(page)).toHaveCount(AUTHOR_COUNT, { timeout: 500 }),
    );
    await expect(directory(page).getByRole("link", { name: RANKED[12]!.name })).toBeFocused();
    expect(await scan(page)).toEqual([]);
});

test("the filter narrows the directory by name, accents and case aside", async ({ page }) => {
    await untilHydrated(
        () => field(page).fill(AUTHOR.name.toUpperCase()),
        () => expect(cards(page)).toHaveText([AUTHOR.name], { timeout: 500 }),
    );
    await expect(directory(page).getByRole("status")).toHaveText("1 colaborador encontrado");
});

test("a name nobody has shows the no-match state, and its reset brings everyone back", async ({
    page,
}, testInfo) => {
    await untilHydrated(
        () => field(page).fill("Zzzz"),
        () =>
            expect(directory(page)).toContainText("Ningún colaborador se llama «Zzzz»", {
                timeout: 500,
            }),
    );
    await expect(cards(page)).toHaveCount(0);
    expect(await scan(page)).toEqual([]);
    await testInfo.attach(`colaboradores-sin-resultados-${testInfo.project.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
    });

    await directory(page).getByRole("button", { name: "Ver todos" }).click();

    await expect(cards(page)).toHaveCount(12);
    await expect(field(page)).toBeFocused();
});

test("an article's author card counts that author's publications", async ({ page }) => {
    const posts = postsBy(AUTHOR.id);

    await page.goto(`/${posts[0]!.slug}/`);

    await expect(
        page.getByRole("link", { name: `Ver sus ${posts.length} publicaciones` }).first(),
    ).toHaveAttribute("href", `/colaboradores/${AUTHOR.slug}/`);
});

test("the authors page has no WCAG AA violations", async ({ page }, testInfo) => {
    const violations = await scan(page);

    await testInfo.attach(`colaboradores-${testInfo.project.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
    });
    expect(violations).toEqual([]);
});
