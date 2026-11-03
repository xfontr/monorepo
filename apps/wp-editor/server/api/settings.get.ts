export default defineEventHandler((event) => refusing(() => useStore(event).readSettings()));
