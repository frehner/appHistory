import { fakeRandomId } from "./helpers";

export class AppHistory {
  currentEntry: Readonly<AppHistoryEntry>;
  entries: Readonly<AppHistoryEntry[]>;

  updateCurrentEntry(options: AppHistoryEntryOptions): void {
    const newState =
      options?.state !== undefined ? options.state : this.currentEntry.state;
    const newUrl = options?.url ?? this.currentEntry.url;
    const newEntry = this.createNewEntry({ newUrl, newState });
    this.currentEntry = newEntry;
    const [replacedEntry, ...restEntries] = this.entries;
    this.entries = Object.freeze([newEntry, ...restEntries]);
  }

  private createNewEntry({
    newUrl,
    newState,
  }: {
    newUrl?: string;
    newState?: any | null;
  }): Readonly<AppHistoryEntry> {
    return Object.freeze({
      key: fakeRandomId(),
      url: newUrl,
      state: newState,
      sameDocument: true,
      onnavigateto: () => {},
      onupcomingnavigate: () => {},
      oncurrententrychange: () => {},
    });
  }

  constructor() {
    this.currentEntry = this.createNewEntry({ newUrl: "test" });
    this.entries = Object.freeze([this.currentEntry]);
  }
}

interface AppHistoryEntry {
  key: AppHistoryEntryKey;
  url: string;
  state: any | null;
  sameDocument: boolean;
  onnavigateto: Readonly<EventHandlerNonNull>;
  onupcomingnavigate: Readonly<EventHandlerNonNull>;
  oncurrententrychange: Readonly<EventHandlerNonNull>;
}

export type AppHistoryEntryKey = string;

type AppHistoryEntryOptions = {
  url?: string;
  state?: any | null;
};
