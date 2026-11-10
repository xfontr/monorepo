import type { ESLint } from "eslint";
import disableNeedsReason from "./disableNeedsReason.ts";
import layerBoundaries from "./layerBoundaries.ts";
import lookupTableShape from "./lookupTableShape.ts";
import namedDefaultExport from "./namedDefaultExport.ts";
import noTemplateCall from "./noTemplateCall.ts";
import propsShape from "./propsShape.ts";
import requireRouteMeta from "./requireRouteMeta.ts";
import templateGlobalI18n from "./templateGlobalI18n.ts";

const monorepo: ESLint.Plugin = {
    meta: { name: "monorepo" },
    rules: {
        "disable-needs-reason": disableNeedsReason,
        "layer-boundaries": layerBoundaries,
        "lookup-table-shape": lookupTableShape,
        "named-default-export": namedDefaultExport,
        "no-template-call": noTemplateCall,
        "props-shape": propsShape,
        "require-route-meta": requireRouteMeta,
        "template-global-i18n": templateGlobalI18n,
    },
};

export default monorepo;
