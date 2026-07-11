import useUserStore from "../stores/user";

type Flags = "showAdvancedOptions" | "showMoreInstructions";

function useFlags() {
    const user = useUserStore();

    return computed<Record<Flags, boolean>>(() => ({
        showAdvancedOptions: user.user?.role === "advanced",
        showMoreInstructions: user.user?.role !== "advanced",
    }));
}

export default useFlags;
