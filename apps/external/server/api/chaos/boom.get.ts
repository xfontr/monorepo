export default defineEventHandler(() => {
    throw new Error("Boom: an unhandled error straight from the route handler");
});
