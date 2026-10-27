export default {
    slots: {
        root: "rounded-sm",
        // Nuxt UI pads per breakpoint, so each step is restated rather than overridden once
        container: "gap-y-4 p-5 sm:p-5",
        description: "font-serif text-citation leading-relaxed",
        footer: "w-full",
    },
    variants: {
        variant: {
            outline: { description: "text-toned" },
        },
    },
    compoundVariants: [
        {
            variant: "outline",
            to: true,
            class: { root: "hover:bg-default hover:ring-accented" },
        },
    ],
};
