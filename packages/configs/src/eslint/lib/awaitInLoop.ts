// A spec's steps are sequential on purpose; source opts out per loop with the reason it must be
const awaitInLoop: object = {
    ignores: ["**/*.spec.ts"],
    rules: { "no-await-in-loop": "error" },
};

export default awaitInLoop;
