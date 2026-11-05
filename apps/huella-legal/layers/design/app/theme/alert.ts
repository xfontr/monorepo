export default {
    slots: {
        root: "gap-3 rounded-sm",
        icon: "mt-0.5",
        title: "font-sans font-semibold",
        description: "font-sans opacity-100",
    },
    compoundVariants: [
        {
            color: "error",
            variant: "subtle",
            class: {
                root: "bg-error-50 ring-error-500",
                title: "text-error-800",
                description: "text-error-800",
            },
        },
    ],
};
