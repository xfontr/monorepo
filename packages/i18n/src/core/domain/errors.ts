export class TranslationsError extends Error {
    constructor(public readonly statusCode: number, public readonly statusMessage: string, options?: ErrorOptions) {
        super(statusMessage, options);
        this.name = new.target.name;
    }
}

export class TranslationsUnavailableError extends TranslationsError {
    constructor(locale: string, cause?: unknown) {
        super(502, `Translations unavailable for "${locale}"`, { cause });
    }
}

export class UndefinedVendorError extends TranslationsError {
    constructor(name: string | undefined, available: string[]) {
        super(500, `Requested vendor "${name ?? null}" does not exist. Available: ${available.join(", ")}`);
    }
}

export class UndefinedLocaleError extends TranslationsError {
    constructor(locale?: string) {
        super(404, `Requested locale "${locale ?? null}" does not exist`);
    }
}
