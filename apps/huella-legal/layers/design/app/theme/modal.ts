export default {
    slots: {
        content: "bg-ivory-50",
    },
    variants: {
        fullscreen: { false: { content: "rounded-sm shadow-2xl" } },
        overlay: { true: { overlay: "bg-huella-ink-900/50" } },
    },
};
