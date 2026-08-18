<script lang="ts" setup>
const SERVER_SCENARIOS = [
    { label: "500 unhandled throw", path: "/api/chaos/boom" },
    { label: "418 createError", path: "/api/chaos/error?code=418" },
    { label: "503 createError", path: "/api/chaos/error?code=503" },
    { label: "Slow (3s)", path: "/api/chaos/slow?ms=3000" },
    { label: "Slow (10s)", path: "/api/chaos/slow?ms=10000" },
    { label: "Block event loop (3s)", path: "/api/chaos/block?ms=3000" },
    { label: "Leak 10MB", path: "/api/chaos/leak?mb=10" },
    { label: "Leak 100MB", path: "/api/chaos/leak?mb=100" },
    { label: "Free the leak", path: "/api/chaos/leak?reset=1" },
    { label: "Nested outbound calls", path: "/api/chaos/nested" },
    { label: "Unreachable upstream", path: "/api/chaos/unreachable" },
    { label: "Log burst (20 lines)", path: "/api/chaos/logs?count=5" },
];

const { $faro } = useNuxtApp();

const output = ref("Nothing yet. Press something.");
const busy = ref(false);
const clientLeak = ref<number[][]>([]);
const leaking = ref<ReturnType<typeof setInterval>>();
const explode = ref(false);

useHead({ title: "Chaos playground", meta: [{ name: "robots", content: "noindex" }] });

const print = (label: string, value: unknown) => {
    output.value = `${new Date().toISOString()}  ${label}\n\n${JSON.stringify(value, null, 4)}`;
};

async function run(label: string, path: string) {
    busy.value = true;
    const started = performance.now();
    const elapsed = () => `${Math.round(performance.now() - started)}ms`;

    try {
        const response = await $fetch(path);
        print(`${label} (${elapsed()})`, { path, response });
    }
    catch (error) {
        const { status, statusText, data } = error as { status?: number, statusText?: string, data?: unknown };
        print(`${label} — FAILED (${elapsed()})`, { path, status, statusText, data });
    }
    finally {
        busy.value = false;
    }
}

async function stampede() {
    busy.value = true;

    const paths = Array.from({ length: 50 }, (_, index) => SERVER_SCENARIOS[index % SERVER_SCENARIOS.length]!.path);
    const results = await Promise.allSettled(paths.map((path) => $fetch(path)));

    print("Stampede of 50 requests", {
        fulfilled: results.filter(({ status }) => status === "fulfilled").length,
        rejected: results.filter(({ status }) => status === "rejected").length,
    });

    busy.value = false;
}

function vueError() {
    explode.value = true;
    print("Vue render error", "Component threw during render, check Faro errors.");
}

function unhandledRejection() {
    void Promise.reject(new Error("Chaos: unhandled promise rejection in the browser"));
    print("Unhandled rejection", "Rejected without a catch, Faro should have it.");
}

function consoleBurst() {
    for (let index = 0; index < 5; index += 1) {
        console.debug(`[chaos] browser debug ${index}`);
        console.info(`[chaos] browser info ${index}`);
        console.warn(`[chaos] browser warn ${index}`);
        console.error(`[chaos] browser error ${index}`);
    }

    print("Console burst", "20 console lines emitted.");
}

function toggleClientLeak() {
    if (leaking.value) {
        clearInterval(leaking.value);
        leaking.value = undefined;
        print("Client leak stopped", { retainedArrays: clientLeak.value.length });

        return;
    }

    leaking.value = setInterval(() => {
        clientLeak.value.push(Array.from({ length: 100_000 }, (_, index) => index));
    }, 200);

    print("Client leak started", "Growing every 200ms. Watch the tab in your browser's memory profiler.");
}

function longTask() {
    const start = performance.now();
    while (performance.now() - start < 2000) { /* freeze the main thread */ }

    print("Long task", { blockedMs: Math.round(performance.now() - start) });
}

function faroEvent() {
    $faro?.api.pushEvent("chaos_button_pressed", { source: "playground" });
    $faro?.api.pushLog(["Chaos playground pushed a log record"]);
    $faro?.api.pushMeasurement({ type: "chaos", values: { pressed: 1 } });
    print("Faro custom telemetry", $faro ? "Event, log and measurement pushed." : "Faro is not running (no URL set).");
}

function identify() {
    $faro?.api.setUser({ id: "chaos-tester", username: "chaos", attributes: { role: "admin" } });
    print("Faro user set", $faro ? "Subsequent signals are attributed to chaos-tester." : "Faro is not running.");
}

onBeforeUnmount(() => clearInterval(leaking.value));
</script>

<template>
    <main class="chaos">
        <h1>Chaos playground</h1>
        <p>Everything here is deliberately broken. Press things, then go look at Grafana.</p>

        <h2>Server</h2>
        <div class="chaos__grid">
            <button
                v-for="{ label, path } in SERVER_SCENARIOS"
                :key="path"
                type="button"
                :disabled="busy"
                @click="run(label, path)"
            >
                {{ label }}
            </button>

            <button
                type="button"
                :disabled="busy"
                @click="stampede"
            >
                Fire 50 requests
            </button>
        </div>

        <h2>Browser</h2>
        <div class="chaos__grid">
            <button
                type="button"
                @click="vueError"
            >
                Vue render error
            </button>
            <button
                type="button"
                @click="unhandledRejection"
            >
                Unhandled rejection
            </button>
            <button
                type="button"
                @click="consoleBurst"
            >
                Console burst
            </button>
            <button
                type="button"
                @click="toggleClientLeak"
            >
                {{ leaking ? "Stop client leak" : "Start client leak" }}
            </button>
            <button
                type="button"
                @click="longTask"
            >
                Freeze main thread (2s)
            </button>
            <button
                type="button"
                @click="faroEvent"
            >
                Push Faro event / log / measurement
            </button>
            <button
                type="button"
                @click="identify"
            >
                Identify as chaos-tester
            </button>
        </div>

        <h2>Destructive</h2>
        <div class="chaos__grid">
            <button
                type="button"
                class="chaos__danger"
                :disabled="busy"
                @click="run('Kill the server', '/api/chaos/crash')"
            >
                Kill the server process
            </button>
        </div>

        <pre class="chaos__output">{{ output }}</pre>

        <ChaosExploder v-if="explode" />
    </main>
</template>

<style scoped>
.chaos {
    max-width: 60rem;
    margin: 0 auto;
    padding: 2rem 1rem;
    font-family: system-ui, sans-serif;
}

.chaos__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.chaos__grid button {
    padding: 0.5rem 0.75rem;
    border: 1px solid currentcolor;
    border-radius: 0.25rem;
    background: none;
    color: inherit;
    cursor: pointer;
    font: inherit;
}

.chaos__grid button:disabled {
    opacity: 0.4;
    cursor: wait;
}

.chaos__danger {
    color: #c0392b;
    font-weight: 600;
}

.chaos__output {
    padding: 1rem;
    border: 1px solid currentcolor;
    border-radius: 0.25rem;
    font-family: ui-monospace, monospace;
    white-space: pre-wrap;
    overflow-x: auto;
}
</style>
