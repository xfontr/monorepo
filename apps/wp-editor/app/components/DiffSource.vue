<script setup lang="ts">
import { html } from "@codemirror/lang-html";
import { MergeView } from "@codemirror/merge";
import { basicSetup, EditorView } from "codemirror";

interface Props {
    before: string;
    after: string;
    editable: boolean;
}

const props = defineProps<Props>();
const draft = defineModel<string>("draft", { required: true });

const host = useTemplateRef<HTMLElement>("host");
let view: MergeView | undefined;

const theme = EditorView.theme({
    "&": { backgroundColor: "var(--ui-bg)", color: "var(--ui-text)", fontSize: "13px" },
    ".cm-gutters": {
        backgroundColor: "var(--ui-bg-muted)",
        color: "var(--ui-text-dimmed)",
        border: "none",
    },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "transparent" },
    ".cm-content": { fontFamily: "ui-monospace, SFMono-Regular, monospace" },
});

const build = () => {
    view?.destroy();

    if (!host.value) return;

    const shared = [basicSetup, html(), theme, EditorView.lineWrapping];

    view = new MergeView({
        parent: host.value,
        a: { doc: props.before, extensions: [...shared, EditorView.editable.of(false)] },
        b: {
            doc: draft.value,
            extensions: [
                ...shared,
                EditorView.editable.of(props.editable),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) draft.value = update.state.doc.toString();
                }),
            ],
        },
        collapseUnchanged: { margin: 3, minSize: 6 },
        gutter: true,
    });
};

onMounted(build);
onBeforeUnmount(() => view?.destroy());

// Rebuilt per article rather than patched, so undo history never crosses articles.
watch(() => [props.before, props.after, props.editable], build);

watch(draft, (value) => {
    if (view && value !== view.b.state.doc.toString()) build();
});
</script>

<template>
    <div class="flex h-full min-h-0 flex-col">
        <div class="grid grid-cols-2 divide-x divide-default border-b border-default">
            <p class="px-3 py-1.5 text-xs font-medium text-muted">Original</p>
            <p class="px-3 py-1.5 text-xs font-medium text-muted">
                Proposed <span v-if="editable" class="text-dimmed">· editable</span>
            </p>
        </div>
        <div ref="host" class="min-h-0 flex-1 overflow-auto" />
    </div>
</template>
