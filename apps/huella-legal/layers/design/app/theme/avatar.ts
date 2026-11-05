export default {
    slots: { fallback: "font-sans font-semibold" },
    variants: {
        color: { primary: { root: "bg-primary-100", fallback: "text-primary" } },
        size: {
            lg: { root: "text-label" },
            "2xl": { root: "text-xs" },
            "3xl": { root: "text-sm" },
        },
    },
    defaultVariants: { color: "primary" },
};
