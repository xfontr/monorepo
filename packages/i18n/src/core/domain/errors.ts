export class TranslationsError extends Error {
    constructor(public readonly statusCode: number, public readonly statusMessage: string, options?: ErrorOptions) {
        super(statusMessage, options);
        this.name = new.target.name;
    }
}

// Always a gateway failure: the only caller-supplied axis is the locale, and that is checked against
// the declared list before the request, so no upstream status is the caller's fault. The status is
// carried for diagnosis rather than to pick one.
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
