export default defineAppConfig({
    journal: {
        issn: "2696-7618",
    },

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
        container: {
            base: "px-4 sm:px-4 md:px-8 lg:px-12",
        },
        header: {
            slots: {
                root: "static z-auto h-auto bg-default backdrop-blur-none",
                container: "h-16 gap-6 md:h-20",
                title: "min-h-11 items-center font-normal rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
                right: "gap-1 md:gap-2",
                content: "max-w-sm bg-ivory-50",
            },
        },
        navigationMenu: {
            compoundVariants: [
                {
                    variant: "link",
                    orientation: "horizontal",
                    class: {
                        list: "gap-1",
                        // The underline's offset puts it on the header's bottom edge, so it follows
                        // `header.container`'s height
                        link: "min-h-11 px-3 font-sans text-sm font-semibold text-toned aria-[current]:text-highlighted focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary after:inset-x-3 after:-bottom-[1.1875rem] after:h-0.5",
                    },
                },
                {
                    variant: "link",
                    orientation: "vertical",
                    class: {
                        list: "divide-y divide-(--ui-border-muted) border-b border-default",
                        link: "min-h-14 px-4 font-serif text-xl text-highlighted aria-[current]:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                    },
                },
            ],
        },
        footer: {
            slots: {
                root: "bg-huella-slate-900 text-huella-slate-200",
                top: "border-b border-huella-slate-700 py-16 lg:py-20",
                container: "flex flex-col gap-4 py-6 font-sans text-xs text-huella-slate-300 md:flex-row md:items-center md:justify-between lg:py-6",
                left: "mt-0 justify-start md:order-1",
                center: "hidden",
                right: "justify-start md:order-3 lg:flex-none",
            },
        },
        footerColumns: {
            slots: {
                root: "xl:block",
                center: "grid grid-flow-row grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3",
                label: "font-sans text-xs font-semibold uppercase tracking-[0.12em] text-huella-teal-300",
                list: "mt-3 flex flex-col space-y-0",
                // The default truncates, which clips "Publicar un TFG o TFM" in the two-column grid at 390px
                linkLabel: "overflow-visible whitespace-normal",
                link: "min-h-11 font-sans text-sm font-normal underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory-50",
            },
            // The colour lives on the active variant because it outranks the `link` slot, whose muted and
            // primary defaults fail contrast on slate
            variants: {
                active: {
                    true: { link: "font-normal text-ivory-50" },
                    false: { link: "text-ivory-100 hover:text-ivory-100" },
                },
            },
        },
        avatar: {
            slots: { fallback: "font-sans font-semibold" },
            variants: {
                color: { primary: { root: "bg-huella-slate-100", fallback: "text-primary" } },
                // Initials are two capitals, so they sit well below Nuxt UI's text size for each step
                size: {
                    "lg": { root: "text-[0.6875rem]" },
                    "2xl": { root: "text-xs" },
                    "3xl": { root: "text-sm" },
                },
            },
            defaultVariants: { color: "primary" },
        },
        input: {
            slots: { base: "min-h-11 bg-ivory-50" },
            defaultVariants: { size: "xl" },
        },
        // Previous and next sit at the ends of the row, and the ellipses go on phones with the numbers
        pagination: {
            slots: { root: "w-full", list: "w-full gap-0", prev: "me-auto", next: "ms-auto", ellipsis: "max-sm:hidden" },
        },
        skeleton: {
            base: "bg-ivory-200",
        },
        select: {
            slots: { base: "min-h-11 bg-ivory-50" },
            compoundVariants: [
                // The ghost select is the inline sort control beside a listing's count, not a form field
                {
                    variant: "ghost",
                    class: {
                        base: "bg-transparent ps-2 pe-8 font-sans text-sm font-semibold text-highlighted hover:bg-huella-slate-900/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                        trailing: "pe-2",
                        trailingIcon: "size-4 text-muted",
                    },
                },
            ],
            defaultVariants: { size: "xl" },
        },
        textarea: {
            slots: { base: "bg-ivory-50" },
            defaultVariants: { size: "xl" },
        },
    },
});
