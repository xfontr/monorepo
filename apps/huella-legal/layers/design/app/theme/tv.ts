export default {
    // tailwind-merge reads the custom type steps in main.css as colours, so `text-meta` next to a
    // colour class was silently dropped from every Nuxt UI `class` and `:ui` override
    twMergeConfig: {
        extend: {
            theme: {
                text: [
                    "display-sm",
                    "display",
                    "display-lg",
                    "h1",
                    "h2",
                    "h3",
                    "section",
                    "card",
                    "reading",
                    "standfirst",
                    "standfirst-lg",
                    "quote",
                    "citation",
                    "meta",
                    "label",
                    "kicker",
                    "title",
                    "title-lg",
                    "title-xl",
                    "feature",
                    "feature-lg",
                    "feature-xl",
                    "figure",
                    "figure-lg",
                    "figure-xl",
                    "pull-quote",
                    "glyph",
                    "wordmark",
                ],
                tracking: ["display", "wordmark", "control", "kicker", "label"],
            },
        },
    },
};
