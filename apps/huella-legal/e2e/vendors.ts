import { http, HttpResponse, type HttpHandler } from "msw";

/** MSW handlers that accept every address the way Kit does a new one on a double opt-in form. */
export const kitHandlers = (baseURL: string): HttpHandler[] => [
    http.post(`${baseURL}/v4/subscribers`, async ({ request }) => {
        const { email_address } = (await request.json()) as { email_address: string };

        return HttpResponse.json(
            { subscriber: { id: 1, email_address, state: "inactive" } },
            { status: 201 },
        );
    }),
    http.post(`${baseURL}/v4/forms/:form/subscribers/:subscriber`, () =>
        HttpResponse.json({}, { status: 201 }),
    ),
];

/** Matches Turnstile's `api.js` on whichever host `@nuxtjs/turnstile` loads it from. */
export const TURNSTILE_SCRIPT_PATTERN = "**/turnstile/v0/api.js";

/** MSW handlers that pass every token the way Cloudflare's siteverify does for a valid one. */
export const turnstileHandlers = (): HttpHandler[] => [
    http.post("*/turnstile/v0/siteverify", () =>
        HttpResponse.json({ success: true, "error-codes": [] }),
    ),
];

/** A stand-in for Turnstile's `api.js` that mints a token at once, for a browser with no network. */
export const TURNSTILE_SCRIPT = `window.turnstile = {
    render: (_, options) => { setTimeout(() => options.callback("e2e")); return "e2e"; },
    reset: () => {},
    remove: () => {},
};`;
