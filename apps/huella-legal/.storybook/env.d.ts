declare module "*.css";

declare const __MESSAGES__: import("vue-i18n").LocaleMessage;
declare const __DATETIME_FORMATS__: import("vue-i18n").IntlDateTimeFormats;

// `main.ts` stubs this Nuxt global before importing `i18n.config.ts`
declare function defineI18nConfig<T>(config: T): T;
