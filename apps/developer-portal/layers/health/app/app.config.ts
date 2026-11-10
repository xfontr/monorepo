export default defineAppConfig({
    nav: {
        issues: { label: "Work in progress", icon: "i-lucide-circle-dot", to: "/issues" },
        coverage: { label: "Coverage", icon: "i-lucide-shield-check", to: "/coverage" },
        deps: { label: "Dependencies", icon: "i-lucide-shield-alert", to: "/deps" },
    },
});
