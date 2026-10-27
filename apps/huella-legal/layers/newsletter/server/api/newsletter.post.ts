import type { NewsletterRequest } from "../../shared/types/NewsletterRequest";
import { subscriptionSchema } from "../../shared/schemas/subscription";
import { addSubscriber } from "../adapters/kit";

// The client words each issue code, since the server has no locale
const schema = subscriptionSchema((issue) => issue);

export default defineEventHandler(async (event): Promise<void> => {
    const body = (await readBody<Partial<NewsletterRequest> | null>(event)) ?? {};

    if (body.website) return;

    await assertChallenge(event, body.token);

    const { email } = assertForm(schema, body);

    await addSubscriber(event, email);
});
