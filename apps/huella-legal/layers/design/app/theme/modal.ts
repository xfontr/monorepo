export default {
    slots: {
        content: "bg-elevated",
    },
    variants: {
        fullscreen: { false: { content: "rounded-sm shadow-2xl" } },
        overlay: { true: { overlay: "bg-neutral-900/50" } },
    },
};
