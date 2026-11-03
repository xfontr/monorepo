import { useFormPost } from "#layers/forms/app/composables/useFormPost";
import type { SubmissionError } from "../../shared/schemas/submission";
import type { SubmissionRequest } from "../../shared/types/SubmissionRequest";

export const useSubmission = () =>
    useFormPost<SubmissionRequest, SubmissionError>("/api/submissions", { multipart: true });
