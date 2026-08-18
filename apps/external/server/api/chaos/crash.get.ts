export default defineEventHandler(() => {
    // Thrown outside the request so nothing can catch it: this ends the process.
    setTimeout(() => {
        throw new Error("Chaos: uncaught exception, process is going down");
    }, 500);

    return { dyingIn: "500ms" };
});
