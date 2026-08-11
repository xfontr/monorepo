class TranslationsError extends Error {
    constructor(public readonly statusCode: number, public readonly statusMessage: string) {
        super();
    }
}

export class TranslationsUnavailableError extends TranslationsError {
    constructor(locale: string) {
        super(502, `Translations unavailable for "${locale}"`);
    }
}

export class UndefinedVendorError extends TranslationsError {
    constructor() {
        super(404, "Requested vendor does not exist");
    }
}

export class UndefinedLocaleError extends TranslationsError {
    constructor(locale?: string) {
        super(404, `Requested locale "${locale ?? null}" does not exist`);
    }
}
