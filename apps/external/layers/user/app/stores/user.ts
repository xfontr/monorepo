import { defineStore } from "pinia";
import UserService from "../UserService";
import IndexedDbUserRepository from "../repositories/IndexedDbUserRepository";

const useUserStore = defineStore("user", () => {
    const adapter = new UserService(new IndexedDbUserRepository());

    const { data: user } = useAsyncData(adapter.get.bind(adapter));

    return { user };
});

export default useUserStore;
