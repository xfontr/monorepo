export default {
    slots: {
        // Nuxt UI sizes per breakpoint, so each step is restated rather than overridden once
        container: "gap-12 py-16 sm:gap-12 sm:py-16 lg:gap-12 lg:py-20",
        headline: "mb-0",
        title: "mt-2 font-serif text-section font-normal tracking-normal text-balance sm:text-section md:text-h2 lg:text-h2",
        description: "font-serif text-base leading-relaxed text-toned sm:text-base",
        footer: "mt-6",
        links: "gap-1",
    },
    variants: {
        orientation: {
            horizontal: {
                container: "lg:grid-cols-12 lg:items-stretch",
                wrapper: "lg:col-span-4",
            },
        },
        title: {
            true: { description: "mt-3" },
        },
    },
};
