import type { SUBMISSION_KINDS } from "../schemas/submission";

export interface SubmissionRequest extends FormRequest {
    name: string;
    email: string;
    kind: (typeof SUBMISSION_KINDS)[number];
    title: string;
    summary: string;
    file?: File | null;
    consent: boolean;
}
