import { eslint } from "@monorepo/configs";

export default [...eslint.createNuxtConfig(), eslint.tailwind("app/assets/css/main.css")];
