import { fakeRandomId } from "./helpers";

export const appHistory: AppHistory = {
  currentEntry: Object.freeze({
    key: fakeRandomId(),
    url: "http",
    state: null,
    sameDocument: true,
    onnavigateto: () => {},
    onupcomingnavigate: () => {},
    oncurrententrychange: () => {},
  }),
  updateCurrentEntry,
  pushNewEntry: (options: AppHistoryEntryOptions) => Promise.resolve(undefined),
  entries: Object.freeze([]),
  navigateTo: () => Promise.resolve(undefined),
  back: () => Promise.resolve(undefined),
  forward: () => Promise.resolve(undefined),
};

function updateCurrentEntry(options: AppHistoryEntryOptions): void {
  const newState = options?.state !== null ? history.state : options.state;
  const newUrl = options?.url ?? location.href;
}

export type AppHistoryEntryKey = string;

// interface AppHistoryEntry extends EventTarget {
interface AppHistoryEntry {
  key: AppHistoryEntryKey;
  url: string;
  state: any | null;
  sameDocument: boolean;
  onnavigateto: Readonly<EventHandlerNonNull>;
  onupcomingnavigate: Readonly<EventHandlerNonNull>;
  oncurrententrychange: Readonly<EventHandlerNonNull>;
}

type AppHistoryEntryOptions = {
  url?: string;
  state?: any | null;
};

// interface AppHistory extends EventTarget {
interface AppHistory {
  currentEntry: Readonly<AppHistoryEntry>;
  updateCurrentEntry: (options?: AppHistoryEntryOptions) => void;
  pushNewEntry: (options?: AppHistoryEntryOptions) => Promise<undefined>;
  entries: readonly AppHistoryEntry[];
  navigateTo: (key: AppHistoryEntryKey) => Promise<undefined>;
  back: () => Promise<undefined>;
  forward: () => Promise<undefined>;
}
