export default {
    slots: {
        // Nuxt UI pads per breakpoint, so each step is restated rather than overridden once
        root: "items-start rounded-sm px-5 py-10 sm:px-5 sm:py-10 md:px-12 lg:px-12 lg:py-10",
        header: "max-w-none items-start gap-4 text-left",
        title: "font-serif font-normal text-balance",
        description: "max-w-md text-left text-pretty font-serif",
        body: "max-w-none items-start self-stretch sm:self-start",
        actions: "flex-col justify-start self-stretch gap-3 sm:flex-row sm:self-start",
    },
    variants: {
        // Line height sits beside the size because tailwind-merge drops a `leading-*` before a `text-*`
        size: { md: { title: "text-h3", description: "text-base leading-relaxed" } },
        variant: {
            outline: { description: "text-toned" },
            naked: { description: "text-toned" },
        },
    },
};
