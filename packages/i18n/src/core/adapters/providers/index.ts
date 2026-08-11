const providers = {
    internal: () => import("./InternalProvider"),
    test: () => import("./TestProvider"),
};

export default providers;
