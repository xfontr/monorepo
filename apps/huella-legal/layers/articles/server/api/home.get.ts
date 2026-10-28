import type { Home } from "../../shared/types/Home";
import { toHome } from "../mappers/home";
import { getArticleIndex } from "../services/articleIndex";

export default defineEventHandler(async (event): Promise<Home> =>
    toHome(await getArticleIndex(event)),
);
