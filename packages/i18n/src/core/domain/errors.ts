export class TranslationsError extends Error {
    constructor(public readonly statusCode: number, public readonly statusMessage: string, options?: ErrorOptions) {
        super(statusMessage, options);
        this.name = new.target.name;
    }
}

// Always a gateway failure: the locale is the only caller input, validated before the request, so no
// upstream status is the caller's fault. `upstreamStatus` is diagnostic only — not what gets served.
export class UpstreamError extends TranslationsError {
    constructor(public readonly upstreamStatus: number | undefined, cause?: unknown) {
        super(502, "Upstream request failed", { cause });
    }
}

export class TranslationsUnavailableError extends TranslationsError {
    constructor(locale: string, cause?: unknown) {
        super(502, `Translations unavailable for "${locale}"`, { cause });
    }
}

export class UndefinedVendorError extends TranslationsError {
    constructor(name: string | undefined, available: readonly string[]) {
        super(500, `Requested vendor "${name ?? null}" does not exist. Available: ${available.join(", ")}`);
    }
}

export class MisconfiguredVendorError extends TranslationsError {
    constructor(vendor: string, public readonly problems: string[]) {
        super(500, `${vendor} is misconfigured: ${problems.join(", ")}`);
    }
}

export class UndefinedLocaleError extends TranslationsError {
    constructor(locale?: string) {
        super(404, `Requested locale "${locale ?? null}" does not exist`);
    }
}

export class UndefinedLocaleProviderError extends TranslationsError {
    constructor(locale: string, vendorName: string) {
        super(500, `Requested locale "${locale}" does not exist for ${vendorName}`);
    }
}
