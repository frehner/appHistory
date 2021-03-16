import { fakeRandomId } from "./helpers";

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
    currentchange: [],
    navigatesuccess: [],
    navigateerror: [],
  };

  private getOptionsFromParams(
    param1?: UpdatePushParam1Types,
    param2?: AppHistoryPushOrUpdateOptions
  ): AppHistoryPushOrUpdateFullOptions | undefined {
    let options: AppHistoryPushOrUpdateFullOptions | undefined;
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

  async update(
    callback?: () => AppHistoryPushOrUpdateFullOptions
  ): Promise<undefined>;
  async update(
    fullOptions?: AppHistoryPushOrUpdateFullOptions
  ): Promise<undefined>;
  async update(
    url?: string,
    options?: AppHistoryPushOrUpdateOptions
  ): Promise<undefined>;
  async update(
    param1?: UpdatePushParam1Types,
    param2?: AppHistoryPushOrUpdateOptions
  ) {
    // used in currentchange event
    const startTime = performance.now();

    const options = this.getOptionsFromParams(param1, param2);

    // location.href updates here

    this.current.__updateEntry(options ?? {});
    this.current.finished = false;

    const respondWithPromiseArray = this.sendNavigateEvent(
      this.current,
      options?.navigateInfo
    );

    this.sendCurrentChangeEvent(startTime);

    return Promise.all(respondWithPromiseArray)
      .then(() => {
        this.current.finished = true;
        this.current.__fireEventListenersForEvent("finish");
        this.sendNavigateSuccessEvent();
      })
      .catch((error) => {
        this.current.finished = true;
        this.current.__fireEventListenersForEvent("finish");
        this.sendNavigateErrorEvent(error);
        throw error;
      });
  }

  async push(
    callback?: () => AppHistoryPushOrUpdateFullOptions
  ): Promise<undefined>;
  async push(
    fullOptions?: AppHistoryPushOrUpdateFullOptions
  ): Promise<undefined>;
  async push(
    url?: string,
    options?: AppHistoryPushOrUpdateOptions
  ): Promise<undefined>;
  async push(
    param1?: UpdatePushParam1Types,
    param2?: AppHistoryPushOrUpdateOptions
  ) {
    // used in the currentchange event
    const startTime = performance.now();

    const options = this.getOptionsFromParams(param1, param2);

    const upcomingEntry = new AppHistoryEntry(options, this.current);

    const respondWithPromiseArray = this.sendNavigateEvent(
      upcomingEntry,
      options?.navigateInfo
    );

    this.current.__fireEventListenersForEvent("navigatefrom");
    const oldCurrent = this.current;
    const oldCurrentIndex = this.entries.findIndex(
      (entry) => entry.key === oldCurrent.key
    );

    const upcomingURL = new URL(
      upcomingEntry.url,
      window.location.origin + window.location.pathname
    );
    if (upcomingURL.origin === window.location.origin) {
      window.history.pushState(null, "", upcomingEntry.url);
    } else {
      window.location.assign(upcomingEntry.url);
    }

    this.current = upcomingEntry;
    this.canGoBack = true;
    this.canGoForward = false;

    this.sendCurrentChangeEvent(startTime);
    this.current.__fireEventListenersForEvent("navigateto");

    this.entries.slice(oldCurrentIndex + 1).forEach((disposedEntry) => {
      disposedEntry.__updateEntry(undefined, -1);
      disposedEntry.__fireEventListenersForEvent("dispose");
    });

    this.entries = [
      ...this.entries.slice(0, oldCurrentIndex + 1),
      this.current,
    ].map((entry, entryIndex) => {
      entry.__updateEntry(undefined, entryIndex);
      return entry;
    });

    return Promise.all(respondWithPromiseArray)
      .then(() => {
        upcomingEntry.finished = true;
        upcomingEntry.__fireEventListenersForEvent("finish");
        this.sendNavigateSuccessEvent();
      })
      .catch((error) => {
        upcomingEntry.finished = true;
        upcomingEntry.__fireEventListenersForEvent("finish");
        this.sendNavigateErrorEvent(error);
        throw error;
      });
  }

  private onEventListeners: Record<
    keyof AppHistoryEventListeners,
    AppHistoryNavigateEventListener | null
  > = {
    navigate: null,
    currentchange: null,
    navigatesuccess: null,
    navigateerror: null,
  };

  onnavigate(callback: AppHistoryNavigateEventListener): void {
    this.addOnEventListener("navigate", callback);
  }

  oncurrentchange(callback: EventListener): void {
    this.addOnEventListener("currentchange", callback);
  }

  onnavigatesuccess(callback: EventListener): void {
    this.addOnEventListener("navigatesuccess", callback);
  }

  onnavigateerror(callback: EventListener): void {
    this.addOnEventListener("navigateerror", callback);
  }

  private addOnEventListener(
    eventName: keyof AppHistoryEventListeners,
    callback: AppHistoryNavigateEventListener | EventListener
  ) {
    if (this.onEventListeners[eventName]) {
      if (eventName === "navigate") {
        this.eventListeners.navigate = this.eventListeners.navigate.filter(
          (existingCallback) =>
            existingCallback !== this.onEventListeners.navigate
        );
      } else {
        this.eventListeners[eventName] = this.eventListeners[eventName].filter(
          (existingCallback) =>
            existingCallback !== this.onEventListeners[eventName]
        );
      }
    }
    this.onEventListeners[eventName] = callback;
    this.addEventListener(eventName, callback);
  }

  addEventListener(
    eventName: keyof AppHistoryEventListeners,
    callback: AppHistoryNavigateEventListener | EventListener
  ): void {
    if (
      eventName === "navigate" ||
      eventName === "currentchange" ||
      eventName === "navigatesuccess" ||
      eventName === "navigateerror"
    ) {
      if (isAppHistoryNavigateEventListener(eventName, callback)) {
        // TS complains if I don't check the type of the callback here
        if (!this.eventListeners.navigate.includes(callback)) {
          this.eventListeners.navigate.push(callback);
        }
      } else {
        if (!this.eventListeners[eventName].includes(callback)) {
          this.eventListeners[eventName].push(callback);
        }
      }
      return;
    }
    // add other event listeners later
    throw new Error("appHistory does not listen for that event at this time");
  }

  async navigateTo(
    key: AppHistoryEntryKey,
    navigationOptions?: AppHistoryNavigationOptions
  ): Promise<undefined> {
    const entryIndex = this.entries.findIndex((entry) => entry.key === key);
    if (entryIndex === -1) {
      throw new DOMException("InvalidStateError");
    }
    const navigatedEntry = this.entries[entryIndex];

    await this.changeCurrentEntry(navigatedEntry, navigationOptions);
    return;
  }

  async back(
    navigationOptions?: AppHistoryNavigationOptions
  ): Promise<undefined> {
    const entryIndex = this.entries.findIndex(
      (entry) => entry.key === this.current.key
    );
    if (entryIndex === 0) {
      // cannot go back if we're at the first entry
      throw new DOMException("InvalidStateError");
    }

    const backEntry = this.entries[entryIndex - 1];
    await this.changeCurrentEntry(backEntry, navigationOptions);
    return;
  }

  async forward(
    navigationOptions?: AppHistoryNavigationOptions
  ): Promise<undefined> {
    const entryIndex = this.entries.findIndex(
      (entry) => entry.key === this.current.key
    );
    if (entryIndex === this.entries.length - 1) {
      // cannot go forward if we're at the last entry
      throw new DOMException("InvalidStateError");
    }

    const forwardEntry = this.entries[entryIndex + 1];
    await this.changeCurrentEntry(forwardEntry, navigationOptions);
    return;
  }

  private async changeCurrentEntry(
    newCurrent: AppHistoryEntry,
    navigationOptions?: AppHistoryNavigationOptions
  ) {
    await this.sendNavigateEvent(newCurrent, navigationOptions?.navigateInfo);
    this.current.__fireEventListenersForEvent("navigatefrom");
    this.current = newCurrent;
    this.current.__fireEventListenersForEvent("navigateto");

    this.canGoBack = this.current.index > 0;
    this.canGoForward = this.current.index < this.entries.length - 1;
  }

  private sendNavigateEvent(
    destinationEntry: AppHistoryEntry,
    info?: any
  ): Array<Promise<undefined>> {
    const respondWithResponses: Array<Promise<undefined>> = [];

    const upcomingURL = new URL(
      destinationEntry.url,
      window.location.origin + window.location.pathname
    );

    const canRespond = upcomingURL.origin === window.location.origin;

    const navigateEvent = new AppHistoryNavigateEvent({
      cancelable: true,
      userInitiated: true,
      hashChange:
        destinationEntry.sameDocument &&
        upcomingURL.hash !== window.location.hash,
      destination: destinationEntry,
      info,
      canRespond,
      respondWith: (respondWithPromise: Promise<undefined>): void => {
        if (canRespond) {
          respondWithResponses.push(respondWithPromise);
        } else {
          throw new Error(
            "You cannot respond to this this event. Check event.canRespond before using respondWith"
          );
        }
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

    return respondWithResponses;
  }

  private sendCurrentChangeEvent(startTime: DOMHighResTimeStamp): void {
    this.eventListeners.currentchange.forEach((listener) => {
      try {
        listener.call(this, new AppHistoryCurrentChangeEvent({ startTime }));
      } catch (error) {}
    });
  }

  private sendNavigateSuccessEvent() {
    this.eventListeners.navigatesuccess.forEach((listener) => {
      try {
        listener(new CustomEvent("TODO figure out the correct event"));
      } catch (error) {}
    });
  }

  private sendNavigateErrorEvent(error: Error) {
    this.eventListeners.navigateerror.forEach((listener) => {
      try {
        listener(
          new CustomEvent("TODO figure out the correct event", {
            detail: { error },
          })
        );
      } catch (error) {}
    });
  }
}

class AppHistoryEntry {
  constructor(
    options?: AppHistoryPushOrUpdateFullOptions,
    previousEntry?: AppHistoryEntry
  ) {
    this._state = null;
    if (options?.state) {
      this._state = options.state;
    }
    this.key = fakeRandomId();
    this.index = -1;
    this.finished = false;

    const upcomingUrl = options?.url ?? previousEntry?.url ?? "";
    this.url = upcomingUrl;

    const upcomingUrlObj = new URL(
      upcomingUrl,
      window.location.origin + window.location.pathname
    );
    this.sameDocument =
      upcomingUrlObj.origin === window.location.origin &&
      upcomingUrlObj.pathname === window.location.pathname;
  }

  key: AppHistoryEntryKey;
  url: string;
  sameDocument: boolean;
  index: number;
  private _state: any | null;
  finished: boolean;

  private eventListeners: AppHistoryEntryEventListeners = {
    navigateto: [],
    navigatefrom: [],
    dispose: [],
    finish: [],
  };

  /** Provides a JSON.parse(JSON.stringify()) copy of the Entry's state.  */
  getState(): any | null {
    return JSON.parse(JSON.stringify(this._state));
  }

  addEventListener(
    eventName: keyof AppHistoryEntryEventListeners,
    callback: EventListener
  ): void {
    if (!this.eventListeners[eventName].includes(callback)) {
      this.eventListeners[eventName].push(callback);
    }
    return;
  }

  /** DO NOT USE; use appHistory.update() instead */
  __updateEntry(
    options?: AppHistoryPushOrUpdateFullOptions,
    newIndex?: number
  ): void {
    // appHistory.update() calls this function but it is not part of the actual public API for an AppHistoryEntry
    if (options?.state !== undefined) {
      // appHistory.update({state: null}) should allow you to null out the state
      this._state = options.state;
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

type AppHistoryNavigateEventListener = (event: AppHistoryNavigateEvent) => void;

type AppHistoryEventListeners = {
  navigate: Array<AppHistoryNavigateEventListener>;
  currentchange: Array<EventListener>;
  navigatesuccess: Array<EventListener>;
  navigateerror: Array<EventListener>;
};

type AppHistoryEntryEventListeners = {
  navigateto: Array<EventListener>;
  navigatefrom: Array<EventListener>;
  dispose: Array<EventListener>;
  finish: Array<EventListener>;
};

type UpdatePushParam1Types =
  | string
  | (() => AppHistoryPushOrUpdateFullOptions)
  | AppHistoryPushOrUpdateFullOptions;

export type AppHistoryEntryKey = string;

interface AppHistoryNavigationOptions {
  navigateInfo?: any;
}

interface AppHistoryPushOrUpdateOptions extends AppHistoryNavigationOptions {
  state?: any | null;
}

interface AppHistoryPushOrUpdateFullOptions
  extends AppHistoryPushOrUpdateOptions {
  url?: string;
}

interface AppHistoryNavigateEventOptions extends EventInit {
  userInitiated: boolean;
  hashChange: boolean;
  destination: AppHistoryEntry;
  formData?: null;
  info: any;
  canRespond: boolean;
  respondWith: (respondWithPromise: Promise<undefined>) => void;
}
class AppHistoryNavigateEvent extends Event {
  constructor(eventInit: AppHistoryNavigateEventOptions) {
    super("AppHistoryNavigateEvent", eventInit);
    this.userInitiated = eventInit.userInitiated ?? false;
    this.hashChange = eventInit.hashChange ?? false;
    this.destination = eventInit.destination;
    this.formData = eventInit.formData;
    this.canRespond = eventInit.canRespond;
    this.respondWith = eventInit.respondWith;
    this.info = eventInit.info;
  }
  readonly userInitiated: boolean;
  readonly hashChange: boolean;
  readonly destination: AppHistoryEntry;
  readonly formData?: null;
  readonly info: unknown;
  readonly canRespond: boolean;
  respondWith: (respondWithPromise: Promise<undefined>) => void;
}

interface AppHistoryCurrentChangeEventInit extends EventInit {
  startTime: DOMHighResTimeStamp;
}
class AppHistoryCurrentChangeEvent extends Event {
  constructor(eventInit: AppHistoryCurrentChangeEventInit) {
    super("AppHistoryCurrentChangeEvent", eventInit);
    this.startTime = eventInit.startTime;
  }
  readonly startTime: DOMHighResTimeStamp;
}

class AppHistoryEntryEvent extends CustomEvent<{ target: AppHistoryEntry }> {
  constructor(
    customEventInit: CustomEventInit,
    eventName: keyof AppHistoryEntryEventListeners
  ) {
    super(eventName, customEventInit);
  }
}

function isAppHistoryNavigateEventListener(
  eventName: keyof AppHistoryEventListeners,
  listener: AppHistoryNavigateEventListener | EventListener
): listener is AppHistoryNavigateEventListener {
  return eventName === "navigate";
}
