import type { FooterColumn, NavigationMenuItem } from "@nuxt/ui";
import type { RouteLocationRaw } from "vue-router";

interface Link {
    key: string
    to: RouteLocationRaw
}

const SECTIONS = [
    { key: "publications", to: { name: "publications" } },
    { key: "subjects", to: { name: "categories" } },
    { key: "collaborators", to: { name: "authors" } },
    { key: "publish", to: { name: "publish" } },
] as const satisfies readonly Link[];

const COLUMNS = [
    {
        key: "journal",
        links: [
            { key: "publications", to: { name: "publications" } },
            { key: "subjects", to: { name: "categories" } },
            { key: "collaborators", to: { name: "authors" } },
            { key: "about", to: { name: "article", params: { slug: "sobre" } } },
        ],
    },
    {
        key: "participate",
        links: [
            { key: "publish", to: { name: "publish" } },
            { key: "publishThesis", to: { name: "publish", hash: "#tesis" } },
            { key: "newsletter", to: { name: "index", hash: "#newsletter" } },
            { key: "contact", to: { name: "article", params: { slug: "contacto" } } },
        ],
    },
    {
        key: "legal",
        links: [
            { key: "legalNotice", to: { name: "article", params: { slug: "aviso-legal" } } },
            { key: "privacy", to: { name: "article", params: { slug: "aviso-legal" }, hash: "#privacidad" } },
            { key: "cookies", to: { name: "article", params: { slug: "aviso-legal" }, hash: "#cookies" } },
        ],
    },
] as const satisfies readonly { key: string, links: readonly Link[] }[];

const SOCIAL = [
    { key: "instagram", icon: "i-lucide-instagram" },
    { key: "linkedin", icon: "i-lucide-linkedin" },
    { key: "x", icon: "i-lucide-twitter" },
] as const;

export interface SocialLink {
    key: string
    icon: string
    to: string
    label: string
}

function withTrailingSlash(path: string): string {
    return path.endsWith("/") ? path : `${path}/`;
}

export function useSiteNav() {
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();
    const { journal } = useAppConfig();
    const { public: { social: profiles } } = useRuntimeConfig();

    const sections = computed<NavigationMenuItem[]>(() => {
        const here = withTrailingSlash(route.path);

        return SECTIONS.map(({ key, to }) => {
            const { path } = router.resolve(to);
            const current = here === path ? "page" : here.startsWith(path) ? "true" : undefined;

            return { "label": t(`app.header.nav.${key}`), to, "active": !!current, "aria-current": current };
        });
    });

    const columns = computed<FooterColumn[]>(() => COLUMNS.map(({ key, links }) => ({
        label: t(`app.footer.columns.${key}`),
        children: links.map((link) => ({ label: t(`app.footer.links.${link.key}`), to: link.to })),
    })));

    const social = computed<SocialLink[]>(() => SOCIAL.filter(({ key }) => profiles[key]).map(({ key, icon }) => ({
        key,
        icon,
        to: profiles[key],
        label: t("app.footer.social.external", { network: t(`app.footer.social.${key}`) }),
    })));

    return { sections, columns, social, issn: journal.issn };
}
