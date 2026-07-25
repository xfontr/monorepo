import type { Messages } from "../types/Messages.ts";

function selectNamespaces(all: Messages, namespaces?: string[]): Messages {
    if (!namespaces?.length) return all;

    const selected: Messages = {};

    for (const namespace of namespaces) {
        if (!Object.prototype.hasOwnProperty.call(all, namespace)) continue;
        selected[namespace] = all[namespace];
    }

    return selected;
}

export default selectNamespaces;
