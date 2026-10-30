import type { Home } from "../../shared/types/Home";
import { toHome } from "../mappers/home";
import { getArticleIndex } from "../services/articleIndex";

defineRouteMeta({
    openAPI: {
        tags: ["Articles"],
        summary: "Read the home page's featured articles and subjects",
    },
});

export default defineEventHandler(async (event): Promise<Home> =>
    toHome(await getArticleIndex(event)),
);
