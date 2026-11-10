export default defineAppConfig({
    ui: {
        tv: {
            // tailwind-merge reads a custom type step as a colour and drops it beside a real one
            twMergeConfig: { extend: { theme: { text: ["2xs"] } } },
        },

        card: {
            variants: {
                variant: {
                    // `outline` with no body padding, for a card that holds a table or a list of rows
                    flush: {
                        root: "bg-default ring ring-default divide-y divide-default",
                        body: "p-0 sm:p-0",
                    },
                },
            },
        },
    },
});
