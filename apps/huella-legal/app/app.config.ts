export default defineAppConfig({
    ui: {
        colors: {
            primary: "huella-slate",
            secondary: "huella-teal",
            neutral: "huella-ink",
            error: "huella-danger",
        },

        // Every control is at least 44 px tall, and fields sit on lighter paper than the canvas
        button: {
            slots: { base: "min-h-11 font-sans font-semibold" },
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
