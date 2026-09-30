import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

const BRAND = "Huella Legal";

const shared = {
    brandTitle: `${BRAND} · Design system`,
    fontBase: "Montserrat, ui-sans-serif, system-ui, sans-serif",
};

// Read once at load, so switching the OS theme takes a reload to show.
const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;

addons.setConfig({
    theme: create(dark
        ? {
            ...shared,
            base: "dark",
            colorPrimary: "#5da399",
            colorSecondary: "#91aebd",
            appBg: "#171717",
            appContentBg: "#242424",
            appBorderColor: "#363636",
            textColor: "#f2f1ef",
            textMutedColor: "#a8a49d",
            barSelectedColor: "#91aebd",
        }
        : {
            ...shared,
            base: "light",
            colorPrimary: "#43877f",
            colorSecondary: "#3e5a6d",
            appBg: "#fafaf9",
            appContentBg: "#ffffff",
            appBorderColor: "#e6e4e0",
            textColor: "#242424",
            textMutedColor: "#6b6863",
            barSelectedColor: "#3e5a6d",
        }),
});

const retitle = () => {
    const title = document.title === "Storybook" ? BRAND : document.title.replace(/⋅ Storybook$/, `⋅ ${BRAND}`);
    if (title === document.title) return;
    document.title = title;
};

new MutationObserver(retitle).observe(document.head, { subtree: true, childList: true, characterData: true });

retitle();
