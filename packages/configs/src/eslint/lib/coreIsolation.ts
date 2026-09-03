const RESTRICTED_IN_CORE = [
    "@nuxt/*",
    "@nuxtjs/*",
    "nitropack",
    "nitropack/*",
    "h3",
    "h3/*",
    "#nuxt/*",
];

const coreIsolation: object = {
    files: ["**/src/core/**/*.ts"],
    rules: {
        "no-restricted-imports": ["error", {
            patterns: [
                {
                    group: RESTRICTED_IN_CORE,
                    message: "src/core/ must not import the Nuxt or Nitro runtime — it is the half a non-Nuxt consumer imports. Put the transport-aware code in src/nuxt/ and hand core what it needs through a port.",
                },
            ],
        }],
    },
};

export default coreIsolation;
