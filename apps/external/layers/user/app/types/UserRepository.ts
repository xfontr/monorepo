import type { User } from "./User";

export interface UserRepository {
    get(): Promise<User | undefined>;
}
