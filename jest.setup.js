process.on("unhandledRejection", (reason, promise) => {
  console.log("unhandledRejection", promise, reason, reason.stack);
  process.exit(1);
});
