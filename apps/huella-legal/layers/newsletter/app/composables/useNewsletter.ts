import { useFormPost } from "#layers/forms/app/composables/useFormPost";
import type { SubscriptionError } from "../../shared/schemas/subscription";
import type { NewsletterRequest } from "../../shared/types/NewsletterRequest";

export const useNewsletter = () =>
    useFormPost<NewsletterRequest, SubscriptionError>("/api/newsletter");
