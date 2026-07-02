import { defineStore } from "pinia";

const useUserStore = defineStore("user", () => {
    const { data: user } = useAsyncData(() => {});

    return {
        user: user.value,
    };
});

export default useUserStore;
