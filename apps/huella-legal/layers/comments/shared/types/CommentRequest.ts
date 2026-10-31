export interface CommentRequest extends FormRequest {
    post: string;
    parent: string;
    name: string;
    email: string;
    content: string;
    consent: boolean;
}
