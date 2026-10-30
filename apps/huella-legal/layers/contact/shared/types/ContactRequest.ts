export interface ContactRequest extends FormRequest {
    name: string;
    email: string;
    message: string;
    consent: boolean;
}
