import type { User } from "../types/User";
import type { UserRepository } from "../types/UserRepository";

class ApiUserRepository implements UserRepository {
    async get(): Promise<User> {
        return {
            email: "",
            id: "",
            name: "",
            role: "advanced",
        };
    }
}

export default ApiUserRepository;
