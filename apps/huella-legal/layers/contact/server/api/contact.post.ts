import type { ContactRequest } from "../../shared/types/ContactRequest";
import { contactSchema } from "../../shared/schemas/contact";
import { sendContactMessage } from "../adapters/resend";

// The client words each issue code, since the server has no locale
const schema = contactSchema((issue) => issue);

export default defineEventHandler(async (event): Promise<void> => {
    const body = (await readBody<Partial<ContactRequest> | null>(event)) ?? {};

    if (body.website) return;

    await assertChallenge(event, body.token);

    const contact = assertForm(schema, body);

    await sendContactMessage(event, contact);
});
