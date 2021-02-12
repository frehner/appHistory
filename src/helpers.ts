export function fakeRandomId(): import("./appHistory").AppHistoryEntryKey {
  // https://stackoverflow.com/a/8084248
  return Math.random().toString(36).substr(2, 10);
}
