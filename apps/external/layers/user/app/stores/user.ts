import { defineStore } from "pinia";
import UserService from "../UserService";
import ApiUserRepository from "../repositories/ApiUserRepository";
import type { User } from "../types/User";

const useUserStore = defineStore("user", () => {
    const adapter = new UserService(new ApiUserRepository());
    const user = ref<User>();

    const data = useAsyncData(adapter.get.bind(adapter));

    async function init() {
        user.value = (await data).data.value;
    }

    return { init, user };
});

export default useUserStore;
