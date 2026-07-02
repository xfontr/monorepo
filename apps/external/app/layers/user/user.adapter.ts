import type { UserAdapter as Adapter } from "./types/UserAdapter";
import type { UserRepository } from "./types/UserRepository";

class UserAdapter implements Adapter {
    constructor(private repository: UserRepository) {}

    public get() {
        return this.repository.get();
    }
}

export default UserAdapter;
