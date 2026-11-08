export const useReplyPace = (): Readonly<Ref<string | undefined>> => {
    const { data } = useFetch<ReplyPace>("/api/replies", {
        key: "reply-pace",
        server: false,
        lazy: true,
    });

    return computed(() => data.value?.slowUntil);
};
