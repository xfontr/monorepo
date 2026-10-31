export interface ReaderComment {
    id: string;
    author: string;
    publishedAt: string;
    paragraphs: string[];
    /** The author of the reply this one answers, when that isn't the thread's first comment. */
    replyTo?: string;
}
