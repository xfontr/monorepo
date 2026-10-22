export default {
    slots: {
        root: "xl:block",
        center: "grid grid-flow-row grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3",
        label: "text-kicker text-huella-teal-300",
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
};
