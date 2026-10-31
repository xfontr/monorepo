import { useFormPost } from "#layers/forms/app/composables/useFormPost";
import type { ContactError } from "../../shared/schemas/contact";
import type { ContactRequest } from "../../shared/types/ContactRequest";

export const useContact = () => useFormPost<ContactRequest, ContactError>("/api/contact");
