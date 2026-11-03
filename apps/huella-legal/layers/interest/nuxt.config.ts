export default defineNuxtConfig({
    components: [
        {
            path: "components",
            ignore: [
                "InterestCalculatorAdvancedForm.vue",
                "InterestCalculatorForm.vue",
                "InterestCalculatorHistory.vue",
                "InterestCalculatorResult.vue",
            ],
        },
    ],

    rendering: {
        prerender: ["/calculo-intereses/"],
    },
});
