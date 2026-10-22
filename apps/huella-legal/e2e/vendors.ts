import { http, HttpResponse, type HttpHandler } from "msw";

/** MSW handlers that accept every member the way Mailchimp's upsert does for a new address. */
export const mailchimpHandlers = (baseURL: string): HttpHandler[] => [
    http.put(`${baseURL}/3.0/lists/:audience/members/:member`, async ({ request }) => {
        const { email_address } = (await request.json()) as { email_address: string };

        return HttpResponse.json({ email_address, status: "pending" });
    }),
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
