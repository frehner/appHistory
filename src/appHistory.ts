// @ts-ignore
import { fakeRandomId } from "./helpers.ts";

export class AppHistory {
  constructor() {
    this.current = new AppHistoryEntry({ url: "TODO FIX DEFAULT URL" });
    this.entries = Object.freeze([this.current]);
    this.navigateEventListeners = [];
  }

  current: Readonly<AppHistoryEntry>;
  entries: Readonly<AppHistoryEntry[]>;
  private navigateEventListeners: Array<
    (event: AppHistoryNavigateEvent) => void
  >;

  update(options: AppHistoryEntryOptions): void {
    this.current.__updateEntry(options);
  }

  async push(options?: AppHistoryEntryOptions): Promise<undefined> {
    const upcomingEntry = new AppHistoryEntry(options, this.current);
    try {
      await this.sendNavigateEvent(upcomingEntry, options?.navigateInfo);
      this.updateCurrentAndEntries(upcomingEntry);
      return;
    } catch (error) {
      if (error instanceof DOMException) {
        // ensure that error is passed through to the client
        throw error;
      }
      return;
    }
  }

  addEventListener(
    eventName: "navigate",
    callback: (event: AppHistoryNavigateEvent) => void
  ): void {
    if (eventName === "navigate") {
      if (!this.navigateEventListeners.includes(callback)) {
        this.navigateEventListeners.push(callback);
      }
      return;
    }
    // add other event listeners later
    throw new Error("appHistory does not listen for that event at this time");
  }

  async navigateTo(key: AppHistoryEntryKey): Promise<undefined> {
    const entryIndex = this.entries.findIndex((entry) => entry.key === key);
    if (entryIndex === -1) {
      throw new DOMException("InvalidStateError");
    }
    const navigatedEntry = this.entries[entryIndex];

    await this.sendNavigateEvent(navigatedEntry);
    this.current = navigatedEntry;
    return;
  }

  async back(): Promise<undefined> {
    const entryIndex = this.entries.findIndex(
      (entry) => entry.key === this.current.key
    );
    if (entryIndex === 0) {
      // cannot go back if we're at the first entry
      throw new DOMException("InvalidStateError");
    }

    const backEntry = this.entries[entryIndex - 1];
    await this.sendNavigateEvent(backEntry);
    this.current = backEntry;
    return;
  }

  async forward(): Promise<undefined> {
    const entryIndex = this.entries.findIndex(
      (entry) => entry.key === this.current.key
    );
    if (entryIndex === this.entries.length - 1) {
      // cannot go forward if we're at the last entry
      throw new DOMException("InvalidStateError");
    }

    const backEntry = this.entries[entryIndex + 1];
    await this.sendNavigateEvent(backEntry);
    this.current = backEntry;
    return;
  }

  private async sendNavigateEvent(
    destinationEntry: AppHistoryEntry,
    info?: any
  ) {
    const respondWithResponses: Array<Promise<undefined>> = [];

    const navigateEvent = new AppHistoryNavigateEvent({
      cancelable: true,
      detail: {
        userInitiated: true,
        sameOrigin: true,
        hashChange: true,
        destination: destinationEntry,
        info,
        respondWith: (respondWithPromise: Promise<undefined>): void => {
          respondWithResponses.push(respondWithPromise);
        },
      },
    });

    this.navigateEventListeners.forEach((listener) => {
      listener.call(this, navigateEvent);
    });

    if (navigateEvent.defaultPrevented) {
      // if any handler called event.preventDefault()
      throw new DOMException("AbortError");
    }

    await Promise.all(respondWithResponses);
    return;
  }

  private updateCurrentAndEntries(newCurrent: AppHistoryEntry): void {
    // things are good and we can update the current entry and the entries list
    const oldCurrent = this.current;
    const oldCurrentIndex = this.entries.findIndex(
      (entry) => entry.key === oldCurrent.key
    );

    this.current = newCurrent;
    this.entries = Object.freeze([
      ...this.entries.slice(0, oldCurrentIndex + 1),
      this.current,
    ]);
  }
}

interface AppHistoryEntry {
  key: AppHistoryEntryKey;
  url: string;
  state: any | null;
  sameDocument: boolean;
  onnavigateto: Readonly<EventHandlerNonNull>;
  onnavigatefrom: Readonly<EventHandlerNonNull>;
  ondispose: Readonly<EventHandlerNonNull>;
}

class AppHistoryEntry {
  constructor(
    options?: AppHistoryEntryOptions,
    previousEntry?: AppHistoryEntry
  ) {
    this.state = null;
    if (options?.state) {
      this.state = options.state;
    }
    this.key = fakeRandomId();
    this.url = options?.url ?? previousEntry?.url ?? "";
    this.sameDocument = true;
  }

  key: AppHistoryEntryKey;
  url: string;
  state: any | null;
  sameDocument: boolean;

  /** DO NOT USE; use appHistory.update() instead */
  __updateEntry(options: AppHistoryEntryOptions): void {
    // appHistory.update() calls this function but it is not part of the actual public API for an AppHistoryEntry
    if (options?.state !== undefined) {
      // appHistory.update({state: null}) should allow you to null out the state
      this.state = options.state;
    }
    if (options?.url) {
      this.url = options.url;
    }
  }
}

export type AppHistoryEntryKey = string;

type AppHistoryEntryOptions = {
  url?: string;
  state?: any | null;
  navigateInfo?: any;
};

interface AppHistoryNavigateEventDetail {
  readonly userInitiated: boolean;
  readonly sameOrigin: boolean;
  readonly hashChange: boolean;
  readonly destination: AppHistoryEntry;
  readonly formData?: null;
  readonly info: any;
  respondWith: () => Promise<undefined>;
}

class AppHistoryNavigateEvent extends CustomEvent<AppHistoryNavigateEventDetail> {
  constructor(customEventInit: CustomEventInit) {
    super("AppHistoryNavigateEvent", customEventInit);
  }
}
