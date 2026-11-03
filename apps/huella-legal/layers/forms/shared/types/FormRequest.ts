/** The fields every form posts beside its own: the `honeypot` and the Turnstile `token`. */
export interface FormRequest {
    honeypot: string;
    token: string;
}
