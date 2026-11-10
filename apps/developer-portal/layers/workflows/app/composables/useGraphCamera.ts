import type { Ref } from "vue";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1.25;
/** A press that moves further than this is a drag, and doesn't select what it started on. */
const DRAG_THRESHOLD = 4;

/** Pan and zoom over a laid-out graph, framing whichever blocks `lit` returns. */
export const useGraphCamera = (
    viewport: Ref<HTMLElement | null>,
    lit: () => { x: number; y: number }[],
) => {
    const camera = reactive({ x: 0, y: 0, k: 1 });
    const easing = ref(false);
    let easeTimer: ReturnType<typeof setTimeout> | undefined;

    const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

    const ease = (animate: boolean) => {
        easing.value = animate;
        clearTimeout(easeTimer);
        if (animate) easeTimer = setTimeout(() => (easing.value = false), 500);
    };

    /** Frames exactly the lit blocks: the selected path, or the whole map with nothing selected. */
    const fit = (animate: boolean) => {
        const box = viewport.value?.getBoundingClientRect();
        const nodes = lit();
        if (!box?.width || nodes.length === 0) return;

        const left = Math.min(...nodes.map(({ x }) => x));
        const top = Math.min(...nodes.map(({ y }) => y));
        const right = Math.max(...nodes.map(({ x }) => x + NODE_WIDTH));
        const bottom = Math.max(...nodes.map(({ y }) => y + NODE_HEIGHT));
        const k = clampZoom(
            Math.min(
                (box.width - PADDING * 2) / (right - left),
                (box.height - PADDING * 2) / (bottom - top),
            ),
        );

        ease(animate);
        camera.k = k;
        camera.x = box.width / 2 - ((left + right) / 2) * k;
        camera.y = box.height / 2 - ((top + bottom) / 2) * k;
    };

    /** Zooms keeping the map point under `(px, py)` in place; the viewport's centre by default. */
    const zoomBy = (factor: number, px?: number, py?: number) => {
        const box = viewport.value?.getBoundingClientRect();
        if (!box) return;

        const cx = px ?? box.width / 2;
        const cy = py ?? box.height / 2;
        const k = clampZoom(camera.k * factor);

        ease(px === undefined);
        camera.x = cx - ((cx - camera.x) / camera.k) * k;
        camera.y = cy - ((cy - camera.y) / camera.k) * k;
        camera.k = k;
    };

    /** Pinch on a trackpad arrives as a ctrl-wheel; a plain wheel keeps scrolling the page. */
    const wheel = (event: WheelEvent) => {
        if (!event.ctrlKey && !event.metaKey) return;

        event.preventDefault();
        const box = viewport.value!.getBoundingClientRect();
        zoomBy(Math.exp(-event.deltaY * 0.01), event.clientX - box.left, event.clientY - box.top);
    };

    const dragging = ref(false);
    let pressed: { x: number; y: number; cameraX: number; cameraY: number; id: number } | null =
        null;
    let dragged = false;

    const press = (event: PointerEvent) => {
        if (event.button !== 0) return;
        pressed = {
            x: event.clientX,
            y: event.clientY,
            cameraX: camera.x,
            cameraY: camera.y,
            id: event.pointerId,
        };
        dragged = false;
    };

    const move = (event: PointerEvent) => {
        if (pressed?.id !== event.pointerId) return;

        const dx = event.clientX - pressed.x;
        const dy = event.clientY - pressed.y;

        // Capturing only once it is a drag, so a plain click still lands on the block under it.
        if (!dragged && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
            dragged = true;
            dragging.value = true;
            ease(false);
            viewport.value?.setPointerCapture(event.pointerId);
        }

        if (dragged) {
            camera.x = pressed.cameraX + dx;
            camera.y = pressed.cameraY + dy;
        }
    };

    const release = (event: PointerEvent) => {
        if (pressed && viewport.value?.hasPointerCapture(event.pointerId)) {
            viewport.value.releasePointerCapture(event.pointerId);
        }
        pressed = null;
        dragging.value = false;
    };

    onBeforeUnmount(() => clearTimeout(easeTimer));

    return {
        camera,
        easing,
        dragging,
        wasDragged: () => dragged,
        fit,
        zoomBy,
        wheel,
        press,
        move,
        release,
    };
};
