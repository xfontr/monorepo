import type { FooterColumn, NavigationMenuItem } from "@nuxt/ui";
import type { AppConfig } from "nuxt/schema";

type NavKey = keyof AppConfig["nav"];

const HEADER_LINKS = [
    "publications",
    "subjects",
    "collaborators",
    "publish",
] as const satisfies readonly NavKey[];

const COLUMNS = [
    { key: "journal", links: ["publications", "subjects", "collaborators", "about"] },
    { key: "participate", links: ["publish", "publishThesis", "newsletter", "contact"] },
    { key: "legal", links: ["legalNotice", "privacy", "cookies"] },
] as const satisfies readonly { key: string; links: readonly NavKey[] }[];

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
    const { journal, nav } = useAppConfig();
    const {
        public: { social: profiles },
    } = useRuntimeConfig();

    const sections = computed<NavigationMenuItem[]>(() => {
        const here = withTrailingSlash(route.path);

        return HEADER_LINKS.map((key) => {
            const to = nav[key];
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
                label: t(`app.footer.links.${link}`),
                to: nav[link],
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
