import { JOURNAL_LOCALE, LONG_DATE } from "./dateFormats";

export default defineI18nConfig(() => ({
    datetimeFormats: {
        [JOURNAL_LOCALE]: { long: LONG_DATE },
    },
}));
