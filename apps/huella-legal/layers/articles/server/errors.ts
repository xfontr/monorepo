export class ArticlesError extends Error {
    constructor(public readonly statusCode: number, public readonly statusMessage: string, options?: ErrorOptions) {
        super(statusMessage, options);
        this.name = new.target.name;
    }
}

// The content route has already settled its status, so it passes through; no response is a 502
export class ContentRouteError extends ArticlesError {
    constructor(cause?: unknown) {
        super((cause as { response?: { status?: number } } | undefined)?.response?.status ?? 502, "Content route failed", { cause });
    }
}

export class MisconfiguredSiteError extends ArticlesError {
    constructor(public readonly problems: string[]) {
        super(500, `Site is misconfigured: ${problems.join(", ")}`);
    }
}

// Only our own diagnoses become an HTTP status; anything else keeps its stack and reports as unhandled
export function rethrowAsHttpError(cause: unknown): never {
    if (cause instanceof ArticlesError) throw createError(cause);

    throw cause;
}
