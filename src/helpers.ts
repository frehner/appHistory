export function fakeRandomId(): import("./appHistory").AppHistoryEntryKey {
  return Math.random().toString(36).substr(2, 10);
}
