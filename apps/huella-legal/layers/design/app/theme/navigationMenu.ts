export default {
    compoundVariants: [
        {
            variant: "link",
            orientation: "horizontal",
            class: {
                list: "gap-1",
                // The underline's offset puts it on the header's bottom edge, so it follows `header.container`'s height
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
};
