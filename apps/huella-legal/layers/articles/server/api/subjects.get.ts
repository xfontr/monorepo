import type { SubjectIndex } from "../../shared/types/SubjectIndex";
import { toSubjectIndex } from "../mappers/subjectIndex";
import { getArticleIndex } from "../services/articleIndex";
import { getCategories } from "../services/categories";

// The index's terms carry no description, so the categories are read once more for theirs
export default defineEventHandler(async (event): Promise<SubjectIndex> => {
    const [index, categories] = await Promise.all([getArticleIndex(event), getCategories(event)]);

    return toSubjectIndex(index, categories);
});
