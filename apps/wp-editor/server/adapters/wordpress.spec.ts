import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { WpPost } from "./wordpress.ts";
import { createWordPress, toSnapshot } from "./wordpress.ts";

const BASE_URL = "https://blog.test";

const post = (id: number): WpPost => ({
    id,
    type: "post",
    status: "publish",
    date: "2026-01-01T00:00:00",
    modified_gmt: "2026-01-02T00:00:00",
    link: `${BASE_URL}/p${id}`,
    title: { raw: `Post ${id}` },
    excerpt: { raw: "" },
    content: { raw: "<!-- wp:paragraph --><p>a</p><!-- /wp:paragraph -->" },
    _embedded: {
        author: [{ name: "Irene" }],
        "wp:featuredmedia": [
            {
                source_url: "full.jpg",
                media_details: { sizes: { thumbnail: { source_url: "t.jpg" } } },
            },
        ],
    },
});

const requests: Request[] = [];
const bodies: unknown[] = [];

const server = setupServer(
    http.get(`${BASE_URL}/wp-json/wp/v2/posts`, ({ request }) => {
        requests.push(request);
        const page = Number(new URL(request.url).searchParams.get("page"));

        return HttpResponse.json([post(page)], { headers: { "X-WP-TotalPages": "2" } });
    }),
    http.put(`${BASE_URL}/wp-json/wp/v2/posts/:id`, async ({ request, params }) => {
        const body = (await request.json()) as object;

        bodies.push(body);

        return HttpResponse.json({ ...post(Number(params.id)), ...body });
    }),
);

const wp = createWordPress({ baseURL: BASE_URL, username: "editor", applicationPassword: "ab cd" });

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
    server.resetHandlers();
    requests.length = 0;
    bodies.length = 0;
});
afterAll(() => server.close());

describe("wordpress adapter", () => {
    it("follows every page, so posts past the first hundred are never silently left out", async () => {
        expect((await wp.list("posts")).map(({ id }) => id)).toEqual([1, 2]);
    });

    it("reads the raw edit context, since writing back rendered html strips the block markers", async () => {
        await wp.list("posts");

        expect(new URL(requests[0]!.url).searchParams.get("context")).toBe("edit");
    });

    it("authenticates with the application password as Basic auth", async () => {
        await wp.list("posts");

        expect(requests[0]?.headers.get("authorization")).toBe(`Basic ${btoa("editor:ab cd")}`);
    });

    it("sends only the proposed fields on update", async () => {
        await wp.update("posts", 7, { content: "<p>b</p>" });

        expect(bodies[0]).toEqual({ content: "<p>b</p>" });
    });

    it("prefers the thumbnail size for the rail image", () => {
        expect(toSnapshot(post(1))).toMatchObject({ author: "Irene", image: "t.jpg" });
    });
});
