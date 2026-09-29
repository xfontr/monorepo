export default defineAppConfig({
    ui: {
        // tailwind-merge reads the custom type steps in main.css as colours, so `text-meta` next to a
        // colour class was silently dropped from every Nuxt UI `class` and `:ui` override
        tv: {
            twMergeConfig: {
                extend: { theme: { text: ["display", "h1", "h2", "h3", "reading", "quote", "citation", "meta"] } },
            },
        },

        colors: {
            primary: "huella-slate",
            secondary: "huella-teal",
            neutral: "huella-ink",
            error: "huella-danger",
        },

        // Every control is at least 44 px tall, and fields sit on lighter paper than the canvas
        button: {
            slots: {
                base: "group/btn min-h-11 font-sans font-semibold tracking-[0.01em] disabled:opacity-40 aria-disabled:opacity-40",
                trailingIcon: "transition-transform group-hover/btn:translate-x-0.5 group-disabled/btn:translate-x-0",
            },
            variants: {
                size: {
                    xl: { base: "px-5 py-2.5 text-sm gap-2", leadingIcon: "size-4.5", trailingIcon: "size-4.5" },
                },
            },
            compoundVariants: [
                // Nuxt UI hovers by fading to 75 %, which washes slate out towards the paper
                { color: "primary", variant: "solid", class: "hover:bg-huella-slate-700 active:bg-huella-slate-800" },
                { color: "secondary", variant: "solid", class: "hover:bg-huella-teal-700 active:bg-huella-teal-800" },
                {
                    color: "neutral",
                    variant: "outline",
                    class: "bg-transparent text-highlighted ring-huella-slate-900 hover:bg-huella-slate-900 hover:text-ivory-50 active:bg-huella-slate-800 disabled:bg-transparent disabled:text-highlighted",
                },
                { color: "neutral", variant: "ghost", class: "text-toned hover:bg-huella-slate-900/6 hover:text-highlighted" },
                {
                    variant: "link",
                    class: "decoration-1 underline-offset-4 hover:underline hover:text-huella-slate-700 active:text-huella-slate-800 disabled:no-underline",
                },
                {
                    variant: ["solid", "outline", "soft", "subtle", "ghost", "link"],
                    class: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                },
                // Link buttons hang into the margin with `-ml-3` / `-mr-3`, so their text aligns with the copy
                { size: "xl", variant: "link", class: "px-3" },
                { size: "xl", square: true, class: "min-w-11 justify-center p-2.5" },
                // A loading button is busy, not unavailable, so it keeps full colour
                { loading: true, class: "cursor-wait disabled:opacity-100" },
            ],
            defaultVariants: { size: "xl" },
        },
        input: {
            slots: { base: "min-h-11 bg-ivory-50" },
            defaultVariants: { size: "xl" },
        },
        select: {
            slots: { base: "min-h-11 bg-ivory-50" },
            defaultVariants: { size: "xl" },
        },
        textarea: {
            slots: { base: "bg-ivory-50" },
            defaultVariants: { size: "xl" },
        },
    },
});
