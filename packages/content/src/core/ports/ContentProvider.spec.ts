import { describe, expect, it, vi } from "vitest";
import ContentProvider from "./ContentProvider";
import type { HttpClient } from "./HttpClient";
import type { Entry, EntryQuery, EntryResource, Page, Query, Term, TermResource } from "#core/domain/content";
import { MisconfiguredVendorError, NotFoundError } from "#core/domain/errors";

const get = vi.fn();
const http: HttpClient = { get };

const listEntries = vi.fn<(resource: EntryResource, query?: EntryQuery) => Promise<Page<Entry>>>();
const listTerms = vi.fn<(resource: TermResource, query?: Query) => Promise<Page<Term>>>();

class StubProvider extends ContentProvider<{ problems: string[] }> {
    protected override configProblems(): string[] {
        return this.config.problems;
    }

    override listEntries(resource: EntryResource, query?: EntryQuery): Promise<Page<Entry>> {
        return listEntries(resource, query);
    }

    override listTerms(resource: TermResource, query?: Query): Promise<Page<Term>> {
        return listTerms(resource, query);
    }

    public fetch(url: string): Promise<unknown> {
        return this.http.get(url);
    }
}

function page<T>(...items: T[]): Page<T> {
    return { items, page: 1, perPage: 1, total: items.length, totalPages: 1 };
}

function build(problems: string[] = []) {
    return new StubProvider({ problems }, http);
}

const entry = { id: "1", slug: "hello", title: "Hello", body: { format: "html", value: "" }, terms: [] } as Entry;
const term = { id: "1", resource: "categories", slug: "news", name: "News" } as Term;

describe("ContentProvider", () => {
    // The registry reads each vendor's config type off this, so it has to stay public
    it("exposes the vendor config to its subclasses and to the registry", () => {
        expect(build().config).toEqual({ problems: [] });
    });

    it("holds the injected transport, so a provider cannot exist unable to fetch", async () => {
        await build().fetch("https://wp.test/wp-json");

        expect(get).toHaveBeenCalledWith("https://wp.test/wp-json");
    });

    describe("when the vendor config cannot work", () => {
        it("refuses to exist, naming the provider that cannot be built", () => {
            expect(() => build(["baseURL is not an absolute URL"])).toThrow(MisconfiguredVendorError);
            expect(() => build(["baseURL is not an absolute URL"])).toThrow(/StubProvider is misconfigured/);
        });

        // One restart per missing variable is the thing worth avoiding
        it("reports every problem at once", () => {
            expect(() => build(["baseURL is not an absolute URL", "token is empty"]))
                .toThrow(/baseURL is not an absolute URL, token is empty/);
        });

        it("reports as an internal error, since the deployment is at fault rather than the vendor", () => {
            expect(() => build(["baseURL is not an absolute URL"]))
                .toThrow(expect.objectContaining({ statusCode: 500 }) as Error);
        });

        // The base constructor runs the check, so an override may only read `config` — pinned here
        // because the type system cannot enforce it and the next vendor will meet it
        it("validates before a subclass's own field initialisers have run", () => {
            class EagerProvider extends StubProvider {
                private readonly derived = "set";

                protected override configProblems(): string[] {
                    return this.derived ? [] : ["derived is unset"];
                }
            }

            expect(() => new EagerProvider({ problems: [] }, http)).toThrow(/derived is unset/);
        });
    });

    // A slug lookup is a one-item list on every CMS, so this is what a vendor inherits until it has
    // a native single-document endpoint
    describe("getEntry", () => {
        it("asks for a single entry by slug and unwraps it", async () => {
            listEntries.mockResolvedValue(page(entry));

            await expect(build().getEntry("posts", "hello")).resolves.toBe(entry);
            expect(listEntries).toHaveBeenCalledWith("posts", { slug: "hello", perPage: 1, locale: undefined });
        });

        it("passes the locale down, so the lookup resolves the same document the caller asked for", async () => {
            listEntries.mockResolvedValue(page(entry));

            await build().getEntry("posts", "hello", "es-ES");

            expect(listEntries).toHaveBeenCalledWith("posts", { slug: "hello", perPage: 1, locale: "es-ES" });
        });

        it("404s a slug that matches nothing, rather than returning undefined", async () => {
            listEntries.mockResolvedValue(page<Entry>());

            await expect(build().getEntry("posts", "nope")).rejects.toThrow(NotFoundError);
            await expect(build().getEntry("posts", "nope")).rejects.toMatchObject({ statusCode: 404 });
            await expect(build().getEntry("posts", "nope")).rejects.toThrow(/"posts".*"nope"/);
        });

        it("lets the vendor's own failure through, rather than reporting it as a miss", async () => {
            const cause = new Error("upstream down");
            listEntries.mockRejectedValue(cause);

            await expect(build().getEntry("posts", "hello")).rejects.toBe(cause);
        });
    });

    describe("getTerm", () => {
        it("asks for a single term by slug and unwraps it", async () => {
            listTerms.mockResolvedValue(page(term));

            await expect(build().getTerm("categories", "news")).resolves.toBe(term);
            expect(listTerms).toHaveBeenCalledWith("categories", { slug: "news", perPage: 1, locale: undefined });
        });

        it("404s a slug that matches nothing", async () => {
            listTerms.mockResolvedValue(page<Term>());

            await expect(build().getTerm("categories", "nope")).rejects.toThrow(NotFoundError);
        });
    });
});
