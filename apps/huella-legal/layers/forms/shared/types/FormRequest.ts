/** The fields every form posts beside its own: the honeypot's `website` and the Turnstile `token`. */
export interface FormRequest {
    website: string;
    token: string;
}
