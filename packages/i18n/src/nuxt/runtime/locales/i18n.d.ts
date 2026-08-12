declare function defineI18nLocale<Messages>(
    loader: (locale: string) => Promise<Messages>,
): (locale: string) => Promise<Messages>;