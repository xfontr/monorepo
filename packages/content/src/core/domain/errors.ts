export class ContentError extends Error {
    constructor(public readonly statusCode: number, public readonly statusMessage: string, options?: ErrorOptions) {
        super(statusMessage, options);
        this.name = new.target.name;
    }
}

// 400 and 404 are the caller's fault. Everything else (wrong credentials, etc.)
// are gateways failures, not client errors.
const PASSTHROUGH_STATUSES: readonly number[] = [400, 404];

export class UpstreamError extends ContentError {
    constructor(public readonly upstreamStatus: number | undefined, cause?: unknown) {
        super(
            upstreamStatus && PASSTHROUGH_STATUSES.includes(upstreamStatus) ? upstreamStatus : 502,
            "Upstream request failed",
            { cause },
        );
    }
}

export class ContentUnavailableError extends ContentError {
    constructor(resource: string, cause?: unknown) {
        super(502, `Content unavailable for "${resource}"`, { cause });
    }
}

export class UndefinedVendorError extends ContentError {
    constructor(name: string | undefined, available: readonly string[]) {
        super(500, `Requested vendor "${name ?? null}" does not exist. Available: ${available.join(", ")}`);
    }
}

export class MisconfiguredVendorError extends ContentError {
    constructor(vendor: string, public readonly problems: string[]) {
        super(500, `${vendor} is misconfigured: ${problems.join(", ")}`);
    }
}

export class UndefinedResourceError extends ContentError {
    constructor(resource: string | undefined, available: readonly string[]) {
        super(404, `Requested resource "${resource ?? null}" does not exist. Available: ${available.join(", ")}`);
    }
}

export class MalformedQueryError extends ContentError {
    constructor(param: string, expected: string) {
        super(400, `Query parameter "${param}" is malformed, expected ${expected}`);
    }
}

export class UnsupportedQueryError extends ContentError {
    constructor(vendor: string, param: string) {
        super(400, `${vendor} does not support the "${param}" query parameter`);
    }
}

export class NotFoundError extends ContentError {
    constructor(resource: string, slug: string) {
        super(404, `No "${resource}" found with slug "${slug}"`);
    }
}
