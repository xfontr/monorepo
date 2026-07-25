import { defineStore } from "pinia";
import UserService from "../UserService";
import IndexedDbUserRepository from "../repositories/IndexedDbUserRepository";
import type { User } from "../types/User";

const useUserStore = defineStore("user", () => {
    const adapter = new UserService(new IndexedDbUserRepository());
    const user = ref<User>();

    const data = useAsyncData(adapter.get.bind(adapter));

    async function init() {
        user.value = (await data).data.value;
    }

    return { init, user };
});

export default useUserStore;
