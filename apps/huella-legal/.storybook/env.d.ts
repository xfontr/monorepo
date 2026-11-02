declare module "*.css";

declare const __MESSAGES__: import("vue-i18n").LocaleMessage;
declare const __DATETIME_FORMATS__: import("vue-i18n").IntlDateTimeFormats;

// Vite isn't a dependency of this app, so its client types aren't available
interface ImportMeta {
    glob<T>(patterns: string[], options: { import: "default" }): Record<string, () => Promise<T>>;
}

// `main.ts` stubs this Nuxt global before importing `i18n.config.ts`
declare function defineI18nConfig<T>(config: T): T;
