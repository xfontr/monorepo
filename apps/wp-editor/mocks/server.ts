import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { WpPost } from "../server/adapters/wordpress.ts";

const BASE_URL = "http://localhost/wordpress";
const STATE = resolve(import.meta.dirname, "../.data/mocks");
const POSTS = resolve(STATE, "wordpress.json");

// Overwritten rather than defaulted, so a real `.env` can never point dev at the live site or store.
process.env.NUXT_WORDPRESS_BASE_URL = BASE_URL;
process.env.NUXT_WORDPRESS_USERNAME = "dev";
process.env.NUXT_WORDPRESS_APPLICATION_PASSWORD = "dev";
process.env.NUXT_EDITOR_STORE = resolve(STATE, "store");

// Both the dev process and its Nitro worker load this file; only the first copy lands.
if (!existsSync(STATE)) {
    cpSync(resolve(import.meta.dirname, "store"), resolve(STATE, "store"), { recursive: true });
    cpSync(resolve(import.meta.dirname, "wordpress.json"), POSTS);
}

const read = (): WpPost[] => JSON.parse(readFileSync(POSTS, "utf8")) as WpPost[];

const save = (posts: WpPost[]) => writeFileSync(POSTS, `${JSON.stringify(posts, null, 2)}\n`);

const TYPES = { posts: "post", pages: "page" } as Record<string, string>;

const find = (posts: WpPost[], type: unknown, id: unknown) =>
    posts.find((post) => post.type === TYPES[String(type)] && post.id === Number(id));

const notFound = () =>
    HttpResponse.json(
        { code: "rest_post_invalid_id", message: "Invalid post ID." },
        { status: 404 },
    );

// WordPress's `modified_gmt`: UTC, second resolution, no zone suffix.
const now = () => new Date().toISOString().slice(0, 19);

const api = `${BASE_URL}/wp-json/wp/v2`;

setupServer(
    http.get(`${api}/:type`, ({ params, request }) => {
        const status = new URL(request.url).searchParams.get("status") ?? "publish";
        const posts = read().filter(
            (post) => post.type === TYPES[String(params.type)] && post.status === status,
        );

        return HttpResponse.json(posts, { headers: { "X-WP-TotalPages": "1" } });
    }),

    http.get(`${api}/:type/:id/revisions`, () => HttpResponse.json([])),

    http.get(`${api}/:type/:id`, ({ params }) => {
        const post = find(read(), params.type, params.id);

        return post ? HttpResponse.json(post) : notFound();
    }),

    http.put(`${api}/:type/:id`, async ({ params, request }) => {
        const posts = read();
        const post = find(posts, params.type, params.id);

        if (!post) return notFound();

        const body = (await request.json()) as Partial<
            Record<"content" | "title" | "excerpt", string>
        >;

        if (body.content !== undefined) post.content.raw = body.content;
        if (body.title !== undefined) post.title.raw = body.title;
        if (body.excerpt !== undefined) post.excerpt.raw = body.excerpt;
        post.modified_gmt = now();
        save(posts);

        return HttpResponse.json(post);
    }),

    http.post(`${api}/:type`, async ({ params, request }) => {
        const posts = read();
        const body = (await request.json()) as Record<string, string>;
        const post: WpPost = {
            id: Math.max(...posts.map(({ id }) => id)) + 1,
            type: TYPES[String(params.type)]!,
            status: body.status ?? "draft",
            date: now(),
            modified_gmt: now(),
            link: BASE_URL,
            title: { raw: body.title ?? "" },
            excerpt: { raw: body.excerpt ?? "" },
            content: { raw: body.content ?? "" },
        };

        save([...posts, post]);

        return HttpResponse.json(post, { status: 201 });
    }),

    http.delete(`${api}/:type/:id`, ({ params }) => {
        const posts = read();
        const post = find(posts, params.type, params.id);

        if (!post) return notFound();

        save(posts.filter((other) => other !== post));

        return HttpResponse.json({ deleted: true, previous: post });
    }),
).listen({
    onUnhandledFrame: ({ frame, defaults }) => {
        if (frame.protocol !== "http") return;

        const { request } = frame.data as { request: Request };
        const url = new URL(request.url);

        if (url.hostname.endsWith("huellalegal.com") || url.href.startsWith(BASE_URL)) {
            defaults.error();
        }
    },
});
