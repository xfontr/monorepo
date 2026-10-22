export default {
    slots: { base: "min-h-11 bg-ivory-50" },
    compoundVariants: [
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
};
