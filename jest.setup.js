process.on("unhandledRejection", (reason, promise) => {
  console.log(promise, reason, reason.stack);
  process.exit(1);
});
