import type { FooterColumn, NavigationMenuItem } from "@nuxt/ui";
import type { AppConfig } from "nuxt/schema";
import type { RouteLocationRaw } from "vue-router";

type NavKey = keyof AppConfig["nav"];
type Current = "page" | "true" | undefined;

interface HeaderSection {
    key: string;
    to: NavKey;
    slot?: string;
    children?: readonly NavKey[];
}

const HEADER: readonly HeaderSection[] = [
    { key: "publications", to: "publications", slot: "publications" },
    { key: "subjects", to: "subjects", slot: "subjects" },
    {
        key: "journal",
        to: "about",
        children: ["about", "collaborators", "contact"],
    },
    { key: "publish", to: "publish" },
];

const COLUMNS = [
    {
        key: "journal",
        links: ["publications", "subjects", "collaborators", "about", "interestCalculator"],
    },
    {
        key: "participate",
        links: ["publish", "publishThesis", "publishGuide", "newsletter", "contact"],
    },
    { key: "legal", links: ["legalNotice", "privacy", "cookies"] },
] as const satisfies readonly { key: string; links: readonly NavKey[] }[];

// The calculator stays off every other page's network, even when a pointer crosses its footer link
const UNPREFETCHED: ReadonlySet<NavKey> = new Set(["interestCalculator"]);

const SOCIAL = [
    { key: "instagram", icon: "i-lucide-instagram" },
    { key: "linkedin", icon: "i-lucide-linkedin" },
    { key: "x", icon: "i-lucide-twitter" },
] as const;

export interface CookiePreferences {
    enabled: boolean;
    open: () => unknown;
}

export interface SocialLink {
    key: string;
    icon: string;
    to: string;
    label: string;
}

const withTrailingSlash = (path: string): string => (path.endsWith("/") ? path : `${path}/`);

export const useSiteNav = (cookiePreferences: CookiePreferences) => {
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();
    const { nav } = useAppConfig();
    const {
        public: { social: profiles },
    } = useRuntimeConfig();

    const sections = computed<NavigationMenuItem[]>(() => {
        const here = withTrailingSlash(route.path);

        // A link to an anchor names a place on a page, never the page being read.
        const currentOf = (to: RouteLocationRaw): Current => {
            const { path, hash } = router.resolve(to);

            if (hash) return undefined;
            if (here === path) return "page";

            return here.startsWith(path) ? "true" : undefined;
        };

        return HEADER.map(({ key, to, slot, children }) => {
            const links = children?.map((child) => ({
                label: t(`app.header.nav.${child}`),
                description: t(`app.header.nav.descriptions.${child}`),
                to: nav[child],
                "aria-current": currentOf(nav[child]),
            }));
            const current: Current =
                currentOf(nav[to]) ??
                (links?.some((link) => link["aria-current"]) ? "true" : undefined);

            return {
                label: t(`app.header.nav.${key}`),
                to: nav[to],
                slot,
                children: links,
                active: !!current,
                "aria-current": current,
            };
        });
    });

    const columns = computed<FooterColumn[]>(() =>
        COLUMNS.map(({ key, links }) => ({
            label: t(`app.footer.columns.${key}`),
            children: [
                ...links.map((link) => ({
                    label: t(`app.footer.links.${link}`),
                    to: nav[link],
                    ...(UNPREFETCHED.has(link) && { prefetch: false }),
                })),
                ...(key === "legal" && cookiePreferences.enabled
                    ? [
                          {
                              label: t("app.footer.links.cookieSettings"),
                              onClick: cookiePreferences.open,
                          },
                      ]
                    : []),
            ],
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

    return { sections, columns, social };
};
