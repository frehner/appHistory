import { fakeRandomId } from "./helpers";

export class AppHistory {
  current: Readonly<AppHistoryEntry>;
  entries: Readonly<AppHistoryEntry[]>;

  update(options: AppHistoryEntryOptions): void {
    this.current = this.createNewEntry(options, true);
    const [, ...restEntries] = this.entries;
    this.entries = Object.freeze([this.current, ...restEntries]);
  }

  async push(options?: AppHistoryEntryOptions): Promise<any | undefined> {
    this.current = this.createNewEntry(options, false);
    this.entries = Object.freeze([this.current, ...this.entries]);
    return undefined;
  }

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

  constructor() {
    this.current = this.createNewEntry({ url: "test" }, false);
    this.entries = Object.freeze([this.current]);
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
