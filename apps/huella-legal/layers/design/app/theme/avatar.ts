export default {
    slots: { fallback: "font-sans font-semibold" },
    variants: {
        color: { primary: { root: "bg-huella-slate-100", fallback: "text-primary" } },
        size: {
            lg: { root: "text-[0.6875rem]" },
            "2xl": { root: "text-xs" },
            "3xl": { root: "text-sm" },
        },
    },
    defaultVariants: { color: "primary" },
};
