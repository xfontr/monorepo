import type { ESLint } from "eslint";
import disableNeedsReason from "./disableNeedsReason.ts";
import lookupTableShape from "./lookupTableShape.ts";
import noTemplateCall from "./noTemplateCall.ts";
import propsShape from "./propsShape.ts";
import requireRouteMeta from "./requireRouteMeta.ts";
import templateGlobalI18n from "./templateGlobalI18n.ts";

const monorepo: ESLint.Plugin = {
    meta: { name: "monorepo" },
    rules: {
        "disable-needs-reason": disableNeedsReason,
        "lookup-table-shape": lookupTableShape,
        "no-template-call": noTemplateCall,
        "props-shape": propsShape,
        "require-route-meta": requireRouteMeta,
        "template-global-i18n": templateGlobalI18n,
    },
};

export default monorepo;
