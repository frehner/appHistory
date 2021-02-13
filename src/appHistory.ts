import { fakeRandomId } from "./helpers";

export class AppHistory {
  currentEntry: Readonly<AppHistoryEntry>;
  entries: Readonly<AppHistoryEntry[]>;

  updateCurrentEntry(options: AppHistoryEntryOptions): void {
    this.currentEntry = this.createNewEntry(options, true);
    const [, ...restEntries] = this.entries;
    this.entries = Object.freeze([this.currentEntry, ...restEntries]);
  }

  async pushNewEntry(
    options?: AppHistoryEntryOptions
  ): Promise<any | undefined> {
    this.currentEntry = this.createNewEntry(options, false);
    this.entries = Object.freeze([this.currentEntry, ...this.entries]);
    return undefined;
  }

  private createNewEntry(
    options: AppHistoryEntryOptions,
    usePreviousStateIfNecessary: boolean
  ): Readonly<AppHistoryEntry> {
    let newState = null;
    if (options?.state === undefined) {
      newState = usePreviousStateIfNecessary
        ? this.currentEntry?.state ?? null
        : null;
    } else {
      newState = options.state;
    }

    const newUrl = options?.url ?? this.currentEntry.url;

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
    this.currentEntry = this.createNewEntry({ url: "test" }, false);
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
