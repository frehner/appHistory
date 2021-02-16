import { fakeRandomId } from "./helpers";

export class AppHistory {
  current: Readonly<AppHistoryEntry>;
  entries: Readonly<AppHistoryEntry[]>;

  constructor() {
    this.current = this.createNewEntry({ url: "TODO FIX DEFAULT URL" }, false);
    this.entries = Object.freeze([this.current]);
  }

  update(options: AppHistoryEntryOptions): void {
    this.current = this.createNewEntry(options, true);
    const [, ...restEntries] = this.entries;
    this.entries = Object.freeze([this.current, ...restEntries]);
  }

  async push(options?: AppHistoryEntryOptions): Promise<any | undefined> {
    const oldCurrent = this.current;
    const oldCurrentIndex = this.entries.findIndex(
      (entry) => entry.key === oldCurrent.key
    );
    this.current = this.createNewEntry(options, false);
    this.entries = Object.freeze([
      ...this.entries.slice(0, oldCurrentIndex + 1),
      this.current,
    ]);
    return undefined;
  }

  // a basic beginning but still needs some work.
  // async navigateTo(key: AppHistoryEntryKey): Promise<any | undefined> {
  //   const entryIndex = this.entries.findIndex((entry) => entry.key === key);

  //   if (entryIndex === -1) {
  //     throw new DOMException("InvalidStateError");
  //   }

  //   this.current = this.entries[entryIndex];
  // }

  private createNewEntry(
    options: AppHistoryEntryOptions,
    usePreviousStateIfNecessary: boolean
  ): Readonly<AppHistoryEntry> {
    let newState = null;
    if (options?.state === undefined) {
      newState = usePreviousStateIfNecessary
        ? this.current?.state ?? null
        : null;
    } else {
      newState = options.state;
    }

    const newUrl = options?.url ?? this.current.url;

    return Object.freeze({
      key: fakeRandomId(),
      url: newUrl,
      state: newState,
      sameDocument: true,
      onnavigateto: () => {},
      onupcomingnavigate: () => {},
      oncurrentchange: () => {},
    });
  }
}

interface AppHistoryEntry {
  key: AppHistoryEntryKey;
  url: string;
  state: any | null;
  sameDocument: boolean;
  onnavigateto: Readonly<EventHandlerNonNull>;
  onupcomingnavigate: Readonly<EventHandlerNonNull>;
  oncurrentchange: Readonly<EventHandlerNonNull>;
}

export type AppHistoryEntryKey = string;

type AppHistoryEntryOptions = {
  url?: string;
  state?: any | null;
};
