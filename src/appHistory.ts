import { fakeRandomId } from "./helpers";

export class AppHistory {
  constructor() {
    this.current = this.createNewEntry({ url: "TODO FIX DEFAULT URL" }, false);
    this.entries = Object.freeze([this.current]);
    this.navigateEventListeners = [];
  }

  current: Readonly<AppHistoryEntry>;
  entries: Readonly<AppHistoryEntry[]>;
  private navigateEventListeners: Array<() => void>;

  update(options: AppHistoryEntryOptions): void {
    this.current = this.createNewEntry(options, true);
    const [, ...restEntries] = this.entries;
    this.entries = Object.freeze([this.current, ...restEntries]);
  }

  async push(options?: AppHistoryEntryOptions): Promise<any | undefined> {
    const upcomingEntry = this.createNewEntry(options, false);
    await this.sendNavigateEvent(upcomingEntry, options?.navigateInfo);
    return;
  }

  addEventListener(eventName: "navigate", callback: () => void): void {
    if (eventName === "navigate") {
      if (!this.navigateEventListeners.includes(callback)) {
        this.navigateEventListeners.push(callback);
      }
      return;
    }
    // add other event listeners later
    throw new Error("appHistory does not listen for that event at this time");
  }

  // a basic beginning but still needs some work.
  // async navigateTo(key: AppHistoryEntryKey): Promise<any | undefined> {
  //   const entryIndex = this.entries.findIndex((entry) => entry.key === key);
  //   if (entryIndex === -1) {
  //     throw new DOMException("InvalidStateError");
  //   }
  //   try {
  //     await this.sendNavigateEvent()
  //     this.current = this.entries[entryIndex];
  //   } catch (error) {
  //   }
  // }

  private async sendNavigateEvent(
    destinationEntry: AppHistoryEntry,
    info?: any
  ) {
    const eventsSent: AppHistoryNavigateEvent[] = [];
    const respondWithResponses: Array<Promise<undefined> | undefined> = [];

    this.navigateEventListeners.forEach((listener) => {
      const navigateEvent = new AppHistoryNavigateEvent({
        cancelable: true,
        detail: {
          userInitiated: true,
          sameOrigin: true,
          hashChange: true,
          destination: destinationEntry,
          info,
          respondWith: (respondWithPromise) => {
            respondWithResponses.push(respondWithPromise);
          },
        },
      });

      eventsSent.push(navigateEvent);
      listener.call(this, navigateEvent);
    });

    if (eventsSent.some((evt) => evt.defaultPrevented)) {
      // if any handler called event.preventDefault()
      throw new DOMException("AbortError");
    }

    try {
      await Promise.all(respondWithResponses);
    } catch (error) {
      // one of the respondWith promises rejected, which means we cancel the navigation
      return;
    }

    // things are good and we can update the current entry and the entries list
    const oldCurrent = this.current;
    const oldCurrentIndex = this.entries.findIndex(
      (entry) => entry.key === oldCurrent.key
    );

    this.current = destinationEntry;
    this.entries = Object.freeze([
      ...this.entries.slice(0, oldCurrentIndex + 1),
      this.current,
    ]);
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
  navigateInfo?: any;
};

interface AppHistoryNavigateEventInit extends CustomEventInit {
  readonly userInitiated: boolean;
  readonly sameOrigin: boolean;
  readonly hashChange: boolean;
  readonly destination: AppHistoryEntry;
  readonly formData?: null;
  readonly info: any;
  respondWith: (T) => Promise<undefined>;
}

class AppHistoryNavigateEvent extends CustomEvent<AppHistoryNavigateEventInit> {
  constructor(customEventInit) {
    super("AppHistoryNavigateEvent", customEventInit);
  }
}
