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
                root: "bg-huella-danger-50 ring-huella-danger-500",
                title: "text-huella-danger-800",
                description: "text-huella-danger-800",
            },
        },
    ],
};
