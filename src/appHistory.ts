// @ts-ignore
import { fakeRandomId } from "./helpers.ts";

export class AppHistory {
  constructor() {
    this.current = new AppHistoryEntry({ url: "TODO FIX DEFAULT URL" });
    this.current.__updateEntry(undefined, 0);
    this.entries = [this.current];
    this.canGoBack = false;
    this.canGoForward = false;
  }

  current: AppHistoryEntry;
  entries: AppHistoryEntry[];
  canGoBack: boolean;
  canGoForward: boolean;
  private eventListeners: AppHistoryEventListeners = {
    navigate: [],
    curentchange: [],
  };

  private getOptionsFromParams(
    param1?: UpdatePushParam1Types,
    param2?: AppHistoryEntryOptions
  ): AppHistoryEntryFullOptions | undefined {
    let options: AppHistoryEntryFullOptions | undefined;
    switch (typeof param1) {
      case "string": {
        if (param2 && typeof param2 === "object") {
          options = param2;
          options.url = param1;
        } else {
          options = { url: param1 };
        }
        break;
      }

      case "object": {
        if (param1) {
          options = param1;
        }
        break;
      }

      // TODO: add case for 'function'
      // waiting on spec clarity to implement though

      default:
        break;
    }

    return options;
  }

  async update(callback?: () => AppHistoryEntryFullOptions): Promise<undefined>;
  async update(fullOptions?: AppHistoryEntryFullOptions): Promise<undefined>;
  async update(
    url?: string,
    options?: AppHistoryEntryOptions
  ): Promise<undefined>;
  async update(
    param1?: UpdatePushParam1Types,
    param2?: AppHistoryEntryOptions
  ) {
    // TODO: potentially roll back the update if the navigate event is cancelled or promise is rejected.
    // waiting on spec clarification before implementing it though

    // used in currentchange event
    const startTime = performance.now();

    const options = this.getOptionsFromParams(param1, param2);
    try {
      // TODO: can update() be called with no parameters? If so, then what happens? see https://github.com/WICG/app-history/issues/52
      this.current.__updateEntry(options ?? {});
      this.sendNavigateEvent(this.current, options?.navigateInfo);
      this.sendCurrentChangeEvent(startTime);
    } catch (error) {
      if (error instanceof DOMException) {
        // ensure that error is passed through to the client
        throw error;
      }
      return;
    }
    return;
  }

  async push(callback?: () => AppHistoryEntryFullOptions): Promise<undefined>;
  async push(fullOptions?: AppHistoryEntryFullOptions): Promise<undefined>;
  async push(
    url?: string,
    options?: AppHistoryEntryOptions
  ): Promise<undefined>;
  async push(param1?: UpdatePushParam1Types, param2?: AppHistoryEntryOptions) {
    // used in the currentchange event
    const startTime = performance.now();

    const options = this.getOptionsFromParams(param1, param2);

    const upcomingEntry = new AppHistoryEntry(options, this.current);
    try {
      await this.sendNavigateEvent(upcomingEntry, options?.navigateInfo);
      const oldCurrent = this.current;
      const oldCurrentIndex = this.entries.findIndex(
        (entry) => entry.key === oldCurrent.key
      );

      oldCurrent.__fireEventListenersForEvent("navigatefrom");

      this.sendCurrentChangeEvent(startTime);

      this.entries.slice(oldCurrentIndex + 1).forEach((disposedEntry) => {
        disposedEntry.__updateEntry(undefined, -1);
        disposedEntry.__fireEventListenersForEvent("dispose");
      });

      this.canGoBack = true;
      this.canGoForward = false;

      this.current = upcomingEntry;
      this.entries = [
        ...this.entries.slice(0, oldCurrentIndex + 1),
        this.current,
      ].map((entry, entryIndex) => {
        entry.__updateEntry(undefined, entryIndex);
        return entry;
      });
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
    eventName: keyof AppHistoryEventListeners,
    callback: (event: AppHistoryNavigateEvent) => void
  ): void {
    if (eventName === "navigate" || eventName === "curentchange") {
      if (!this.eventListeners[eventName].includes(callback)) {
        this.eventListeners[eventName].push(callback);
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

    await this.changeCurrentEntry(navigatedEntry);
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
    await this.changeCurrentEntry(backEntry);
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

    const forwardEntry = this.entries[entryIndex + 1];
    await this.changeCurrentEntry(forwardEntry);
    return;
  }

  private async changeCurrentEntry(newCurrent: AppHistoryEntry) {
    await this.sendNavigateEvent(newCurrent);
    this.current.__fireEventListenersForEvent("navigatefrom");
    this.current = newCurrent;
    this.current.__fireEventListenersForEvent("navigateto");

    this.canGoBack = this.current.index > 0;
    this.canGoForward = this.current.index < this.entries.length - 1;
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

    this.eventListeners.navigate.forEach((listener) => {
      try {
        listener.call(this, navigateEvent);
      } catch (error) {}
    });

    if (navigateEvent.defaultPrevented) {
      // if any handler called event.preventDefault()
      throw new DOMException("AbortError");
    }

    await Promise.all(respondWithResponses);
    return;
  }

  private sendCurrentChangeEvent(startTime: DOMHighResTimeStamp): void {
    this.eventListeners.curentchange.forEach((listener) => {
      try {
        listener.call(
          this,
          new AppHistoryCurrentChangeEvent({ detail: { startTime } })
        );
      } catch (error) {}
    });
  }
}

class AppHistoryEntry {
  constructor(
    options?: AppHistoryEntryFullOptions,
    previousEntry?: AppHistoryEntry
  ) {
    this.state = null;
    if (options?.state) {
      this.state = options.state;
    }
    this.key = fakeRandomId();
    this.url = options?.url ?? previousEntry?.url ?? "";
    this.sameDocument = true;
    this.index = -1;
  }

  key: AppHistoryEntryKey;
  url: string;
  state: any | null;
  sameDocument: boolean;
  index: number;

  private eventListeners: AppHistoryEntryEventListeners = {
    navigateto: [],
    navigatefrom: [],
    dispose: [],
  };

  addEventListener(
    eventName: keyof AppHistoryEntryEventListeners,
    callback: (event: CustomEvent) => void
  ): void {
    if (!this.eventListeners[eventName].includes(callback)) {
      this.eventListeners[eventName].push(callback);
    }
    return;
  }

  /** DO NOT USE; use appHistory.update() instead */
  __updateEntry(options?: AppHistoryEntryFullOptions, newIndex?: number): void {
    // appHistory.update() calls this function but it is not part of the actual public API for an AppHistoryEntry
    if (options?.state !== undefined) {
      // appHistory.update({state: null}) should allow you to null out the state
      this.state = options.state;
    }
    if (options?.url) {
      this.url = options.url;
    }

    if (typeof newIndex === "number") {
      this.index = newIndex;
    }
  }

  /** DO NOT USE; for internal use only */
  __fireEventListenersForEvent(
    eventName: keyof AppHistoryEntryEventListeners
  ): void {
    const newEvent = new AppHistoryEntryEvent(
      { detail: { target: this } },
      eventName
    );
    this.eventListeners[eventName].map((listener) => {
      try {
        listener(newEvent);
      } catch (error) {}
    });
  }
}

type AppHistoryEventListeners = {
  navigate: Array<(event: AppHistoryNavigateEvent) => void>;
  curentchange: Array<(event: CustomEvent) => void>;
};

type AppHistoryEntryEventListeners = {
  navigateto: Array<(event: CustomEvent) => void>;
  navigatefrom: Array<(event: CustomEvent) => void>;
  dispose: Array<(event: CustomEvent) => void>;
};

type UpdatePushParam1Types =
  | string
  | (() => AppHistoryEntryFullOptions)
  | AppHistoryEntryFullOptions;

export type AppHistoryEntryKey = string;

interface AppHistoryEntryOptions {
  state?: any | null;
  navigateInfo?: any;
}

interface AppHistoryEntryFullOptions extends AppHistoryEntryOptions {
  url?: string;
}

class AppHistoryNavigateEvent extends CustomEvent<{
  readonly userInitiated: boolean;
  readonly sameOrigin: boolean;
  readonly hashChange: boolean;
  readonly destination: AppHistoryEntry;
  readonly formData?: null;
  readonly info: any;
  respondWith: () => Promise<undefined>;
}> {
  constructor(customEventInit: CustomEventInit) {
    super("AppHistoryNavigateEvent", customEventInit);
  }
}

class AppHistoryCurrentChangeEvent extends CustomEvent<{
  startTime: DOMHighResTimeStamp;
}> {
  constructor(customEventInit: CustomEventInit) {
    super("AppHistoryCurrentChangeEvent", customEventInit);
  }
}

class AppHistoryEntryEvent extends CustomEvent<{ target: AppHistoryEntry }> {
  constructor(
    customEventInit: CustomEventInit,
    eventName: keyof AppHistoryEntryEventListeners
  ) {
    super(eventName, customEventInit);
  }
}
