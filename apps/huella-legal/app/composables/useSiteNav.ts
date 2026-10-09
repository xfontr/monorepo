import type { FooterColumn, NavigationMenuItem } from "@nuxt/ui";
import type { RouteLocationRaw } from "vue-router";

interface Link {
    key: string;
    to: RouteLocationRaw;
}

export const DESTINATIONS = {
    newsletter: { name: "index", hash: "#newsletter" },
    contact: { name: "article", params: { slug: "contacto" } },
    legal: { name: "article", params: { slug: "aviso-legal" } },
} as const satisfies Record<string, RouteLocationRaw>;

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
            { key: "newsletter", to: DESTINATIONS.newsletter },
            { key: "contact", to: DESTINATIONS.contact },
        ],
    },
    {
        key: "legal",
        links: [
            { key: "legalNotice", to: DESTINATIONS.legal },
            { key: "privacy", to: { ...DESTINATIONS.legal, hash: "#privacidad" } },
            { key: "cookies", to: { ...DESTINATIONS.legal, hash: "#cookies" } },
        ],
    },
] as const satisfies readonly { key: string; links: readonly Link[] }[];

const SOCIAL = [
    { key: "instagram", icon: "i-lucide-instagram" },
    { key: "linkedin", icon: "i-lucide-linkedin" },
    { key: "x", icon: "i-lucide-twitter" },
] as const;

export interface SocialLink {
    key: string;
    icon: string;
    to: string;
    label: string;
}

const withTrailingSlash = (path: string): string => (path.endsWith("/") ? path : `${path}/`);

export const useSiteNav = () => {
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();
    const { journal } = useAppConfig();
    const {
        public: { social: profiles },
    } = useRuntimeConfig();

    const sections = computed<NavigationMenuItem[]>(() => {
        const here = withTrailingSlash(route.path);

        return SECTIONS.map(({ key, to }) => {
            const { path } = router.resolve(to);
            const current = here === path ? "page" : here.startsWith(path) ? "true" : undefined;

            return {
                label: t(`app.header.nav.${key}`),
                to,
                active: !!current,
                "aria-current": current,
            };
        });
    });

    const columns = computed<FooterColumn[]>(() =>
        COLUMNS.map(({ key, links }) => ({
            label: t(`app.footer.columns.${key}`),
            children: links.map((link) => ({
                label: t(`app.footer.links.${link.key}`),
                to: link.to,
            })),
        })),
    );

    const social = computed<SocialLink[]>(() =>
        SOCIAL.filter(({ key }) => profiles[key]).map(({ key, icon }) => ({
            key,
            icon,
            to: profiles[key],
            label: t("app.footer.social.external", { network: t(`app.footer.social.${key}`) }),
        })),
    );

    return { sections, columns, social, issn: journal.issn };
};
