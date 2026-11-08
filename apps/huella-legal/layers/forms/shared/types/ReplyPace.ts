/** Whether the editors are answering more slowly than the forms' usual promise. */
export interface ReplyPace {
    /** The last slow day as `YYYY-MM-DD`, present only until it has passed. */
    slowUntil?: string;
}
