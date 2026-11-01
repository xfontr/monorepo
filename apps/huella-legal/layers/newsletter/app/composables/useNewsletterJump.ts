export const NEWSLETTER_ID = "newsletter";

const TINT = "color-mix(in oklab, var(--ui-primary) 20%, transparent)";

const WASH: Keyframe[] = [
    { boxShadow: "inset 0 0 0 100vmax transparent" },
    { boxShadow: `inset 0 0 0 100vmax ${TINT}`, offset: 0.25 },
    { boxShadow: "inset 0 0 0 100vmax transparent" },
];

const arrive = (): void => {
    const band = document.getElementById(NEWSLETTER_ID);

    band?.animate(WASH, { duration: 2100, delay: 1100, easing: "ease-out" });
    band?.querySelector<HTMLInputElement>('input[type="email"]')?.focus({ preventScroll: true });
};

export const useNewsletterJump = () => {
    const { hooks } = useNuxtApp();

    return (event: MouseEvent): void => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const band = document.getElementById(NEWSLETTER_ID);

        if (!band) {
            hooks.hookOnce("page:loading:end", () => {
                requestAnimationFrame(arrive);
            });
            return;
        }

        event.preventDefault();
        band.scrollIntoView({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
        arrive();
    };
};
