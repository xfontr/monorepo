/** Holds a navigation or a tab close while `dirty` holds, until the user leaves anyway. */
export const useLeaveGuard = (dirty: () => boolean, onLeave: () => void) => {
    const leaving = ref(false);
    const destination = ref<string | null>(null);

    onBeforeRouteLeave((to) => {
        if (!dirty()) return true;
        destination.value = to.fullPath;
        leaving.value = true;
        return false;
    });

    // `onLeave` has to make `dirty` false, or the guard holds this navigation too.
    const leave = async () => {
        const to = destination.value;
        onLeave();
        leaving.value = false;
        if (to) await navigateTo(to);
    };

    if (import.meta.client) {
        const warn = (event: BeforeUnloadEvent) => {
            if (dirty()) event.preventDefault();
        };
        onMounted(() => window.addEventListener("beforeunload", warn));
        onBeforeUnmount(() => window.removeEventListener("beforeunload", warn));
    }

    return { leaving, leave };
};
