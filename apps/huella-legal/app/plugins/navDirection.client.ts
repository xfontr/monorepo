const position = () => (window.history.state as { position?: number } | null)?.position;

export default defineNuxtPlugin(({ $router }) => {
    let current: number | undefined;

    $router.beforeEach(() => {
        const next = position();
        const back = next !== undefined && current !== undefined && next < current;

        document.documentElement.dataset.nav = back ? "back" : "forward";
    });

    $router.afterEach(() => {
        current = position();
    });
});
