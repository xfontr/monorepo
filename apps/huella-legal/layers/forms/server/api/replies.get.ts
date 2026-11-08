import type { ReplyPace } from "../../shared/types/ReplyPace";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// The editors' calendar day, so the notice lasts through the date they set wherever the reader is
const today = (): string =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());

export default defineEventHandler((event): ReplyPace => {
    const until = useRuntimeConfig(event).forms.slowRepliesUntil;

    if (!until) return {};

    if (!ISO_DATE.test(until) || Number.isNaN(Date.parse(until)))
        throw createError({
            statusCode: 500,
            statusMessage: "NUXT_FORMS_SLOW_REPLIES_UNTIL is not a YYYY-MM-DD date",
        });

    return today() <= until ? { slowUntil: until } : {};
});

defineRouteMeta({
    openAPI: {
        tags: ["Forms"],
        summary: "Say until when replies to Contacto and Publicar are slower than usual",
        responses: {
            200: { description: "OK, with `slowUntil` only while that day has not passed" },
            500: { description: "The configured date is not `YYYY-MM-DD`" },
        },
    },
});
