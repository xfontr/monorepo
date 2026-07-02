import type { User } from "./User";

export interface UserAdapter {
    get: () => Promise<User>;
}
