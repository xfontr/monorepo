export default {
    slots: {
        base: "group/btn min-h-11 font-sans font-semibold tracking-control disabled:opacity-40 aria-disabled:opacity-40",
        trailingIcon:
            "transition-transform group-hover/btn:translate-x-0.5 group-disabled/btn:translate-x-0",
    },
    variants: {
        size: {
            xl: {
                base: "px-5 py-2.5 text-sm gap-2",
                leadingIcon: "size-4.5",
                trailingIcon: "size-4.5",
            },
        },
    },
    compoundVariants: [
        {
            // Nuxt UI hovers by fading to 75 %, which washes slate out towards the paper
            color: "primary",
            variant: "solid",
            class: "hover:bg-primary-700 active:bg-primary-800",
        },
        {
            color: "secondary",
            variant: "solid",
            class: "hover:bg-secondary-700 active:bg-secondary-800",
        },
        {
            color: "neutral",
            variant: "outline",
            class: "bg-transparent text-highlighted ring-inverted hover:bg-inverted hover:text-inverted active:bg-huella-slate-800 disabled:bg-transparent disabled:text-highlighted",
        },
        {
            color: "neutral",
            variant: "ghost",
            class: "text-toned hover:bg-inverted/6 hover:text-highlighted",
        },
        {
            variant: "link",
            class: "decoration-1 underline-offset-4 hover:underline hover:text-primary-700 active:text-primary-800 disabled:no-underline",
        },
        {
            variant: ["solid", "outline", "soft", "subtle", "ghost", "link"],
            class: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        },
        // Link buttons hang into the margin with `-ml-3` / `-mr-3`, so their text aligns with the copy
        { size: "xl", variant: "link", class: "px-3" },
        { size: "xl", square: true, class: "min-w-11 justify-center p-2.5" },
        { loading: true, class: "cursor-wait disabled:opacity-100" },
    ],
    defaultVariants: { size: "xl" },
};
