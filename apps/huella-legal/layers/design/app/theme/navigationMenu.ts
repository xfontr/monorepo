export default {
    compoundVariants: [
        {
            variant: "link",
            orientation: "horizontal",
            class: {
                list: "gap-1",
                // The underline's offset puts it on the header's bottom edge, so it follows `header.container`'s height
                link: "min-h-11 px-3 font-sans text-sm font-semibold text-toned aria-[current]:text-highlighted focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary after:inset-x-3 after:-bottom-[1.1875rem] after:h-0.5",
                linkTrailingIcon: "size-4 text-dimmed",
                // `top-full` is the nav's own bottom edge, which sits 11px above the header's
                viewport: "mt-3 shrink-0 rounded-xs bg-default shadow-lg ring-default",
                childList: "w-80 gap-0 p-2",
                childLink:
                    "rounded-xs px-3 py-2.5 before:rounded-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                childLinkLabel: "font-serif text-base text-highlighted",
                childLinkDescription: "font-sans text-meta text-pretty text-muted",
            },
        },
        {
            orientation: "horizontal",
            contentOrientation: "vertical",
            class: {
                content: "w-auto",
            },
        },
        {
            variant: "link",
            orientation: "vertical",
            class: {
                list: "divide-y divide-muted border-b border-default",
                link: "min-h-14 px-4 font-serif text-xl text-highlighted aria-[current]:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                childList: "ms-4 mb-3 border-s border-default",
            },
        },
        {
            variant: "link",
            orientation: "vertical",
            level: true,
            class: {
                link: "min-h-11 text-lg",
            },
        },
    ],
};
