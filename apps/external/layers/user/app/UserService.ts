import type { UserRepository } from "./types/UserRepository";

class UserAdapter {
    private repository: UserRepository;

    constructor(repository: UserRepository) {
        this.repository = repository;
    }

    get() {
        return this.repository.get();
    }
}

export default UserAdapter;
