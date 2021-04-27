import { fakeRandomId } from "./helpers";

export class AppHistory {
  constructor() {
    this.current = new AppHistoryEntry({ url: window.location.href });
    this.current.__updateEntry(undefined, 0);
    this.entries = [this.current];
    this.canGoBack = false;
    this.canGoForward = false;
  }

  current: AppHistoryEntry;
  entries: AppHistoryEntry[];
  canGoBack: boolean;
  canGoForward: boolean;
  transition?: AppHistoryTransition;
  private eventListeners: AppHistoryEventListeners = {
    navigate: [],
    currentchange: [],
    navigatesuccess: [],
    navigateerror: [],
  };

  private getOptionsFromParams(
    param1?: UpdatePushParam1Types,
    param2?: AppHistoryNavigateOptions
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

      default:
        break;
    }

    return options;
  }

  async navigate(
    fullOptions?: AppHistoryPushOrUpdateFullOptions
  ): Promise<undefined>;
  async navigate(
    url?: string,
    options?: AppHistoryNavigateOptions
  ): Promise<undefined>;
  async navigate(
    param1?: UpdatePushParam1Types,
    param2?: AppHistoryNavigateOptions
  ) {
    // used in the currentchange event
    const startTime = performance.now();

    const options = this.getOptionsFromParams(param1, param2);

    if (options?.replace && Object.keys(options).length === 1) {
      throw new Error("Must include more options than just {'replace: true'}");
    }

    const previousEntry = this.current;
    const upcomingEntry = new AppHistoryEntry(options, this.current);

    const respondWithPromiseArray = this.sendNavigateEvent(
      options?.replace ? this.current : upcomingEntry,
      options?.navigateInfo
    );

    if (!options?.replace) {
      this.current.__fireEventListenersForEvent("navigatefrom");
    }

    const previousEntryIndex = this.entries.findIndex(
      (entry) => entry.key === previousEntry.key
    );

    const upcomingURL = new URL(
      upcomingEntry.url,
      window.location.origin + window.location.pathname
    );

    if (upcomingURL.origin === window.location.origin) {
      if (options?.replace) {
        window.history.replaceState(options?.state, "", upcomingEntry.url);
      } else {
        window.history.pushState(options?.state, "", upcomingEntry.url);
      }
    } else {
      window.location.assign(upcomingEntry.url);
    }

    if (options?.replace) {
      this.current.__updateEntry(options ?? {});
    }

    if (!options?.replace) {
      this.current = upcomingEntry;
      this.canGoBack = true;
      this.canGoForward = false;
    }

    const oldTransition = this.transition;
    this.transition = new AppHistoryTransition({
      type: options?.replace ? "replace" : "push",
      from: previousEntry,
    });

    this.sendCurrentChangeEvent(startTime);

    if (!options?.replace) {
      this.current.__fireEventListenersForEvent("navigateto");
    }

    if (oldTransition) {
      // we fire the abort here for previous entry.
      // which causes the handler below to fire
      previousEntry.__fireAbortForAssociatedEvent();
    }

    let thisEntrysAbortError: DOMException | undefined;
    upcomingEntry.__getAssociatedAbortSignal()?.addEventListener(
      "abort",
      () => {
        thisEntrysAbortError = new DOMException(
          `A new entry was added before the promises passed to respondWith() resolved for entry with url ${upcomingEntry.url}`,
          "AbortError"
        );
        this.sendNavigateErrorEvent(thisEntrysAbortError);

        // reject oldTransition.finished with abort error
        oldTransition?.__fireFinished(thisEntrysAbortError);
      },
      { once: true }
    );

    if (!options?.replace) {
      this.entries.slice(previousEntryIndex + 1).forEach((disposedEntry) => {
        disposedEntry.__updateEntry(undefined, -1);
        disposedEntry.__fireEventListenersForEvent("dispose");
      });

      this.entries = [
        ...this.entries.slice(0, previousEntryIndex + 1),
        this.current,
      ].map((entry, entryIndex) => {
        entry.__updateEntry(undefined, entryIndex);
        return entry;
      });
    }

    return Promise.all(respondWithPromiseArray)
      .then(() => {
        if (thisEntrysAbortError) {
          throw thisEntrysAbortError;
        }
        this.transition?.__fireFinished();
        this.transition = undefined;

        (options?.replace
          ? previousEntry
          : upcomingEntry
        ).__fireEventListenersForEvent("finish");

        this.sendNavigateSuccessEvent();
      })
      .catch((error) => {
        if (error && error === thisEntrysAbortError) {
          // abort errors don't change finished or fire the finish event. the navigateError event was already fired
          throw error;
        }
        this.transition?.__fireFinished(error);
        this.transition = undefined;

        (options?.replace
          ? previousEntry
          : upcomingEntry
        ).__fireEventListenersForEvent("finish");

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

  set onnavigate(callback: AppHistoryNavigateEventListener) {
    this.addOnEventListener("navigate", callback);
  }

  set oncurrentchange(callback: EventListener) {
    this.addOnEventListener("currentchange", callback);
  }

  set onnavigatesuccess(callback: EventListener) {
    this.addOnEventListener("navigatesuccess", callback);
  }

  set onnavigateerror(callback: EventListener) {
    this.addOnEventListener("navigateerror", callback);
  }

  private addOnEventListener(
    eventName: keyof AppHistoryEventListeners,
    callback: AppHistoryNavigateEventListener | EventListener | null
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
    if (callback) {
      this.addEventListener(eventName, callback);
    }
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

  async goTo(
    key: AppHistoryEntryKeyOrId,
    navigationOptions?: AppHistoryNavigationOptions
  ) {
    const entryIndex = this.entries.findIndex((entry) => entry.key === key);
    if (entryIndex === -1) {
      throw new DOMException("InvalidStateError");
    }
    const navigatedEntry = this.entries[entryIndex];

    return this.changeCurrentEntry(navigatedEntry, navigationOptions);
  }

  async back(navigationOptions?: AppHistoryNavigationOptions) {
    const entryIndex = this.entries.findIndex(
      (entry) => entry.key === this.current.key
    );
    if (entryIndex === 0) {
      // cannot go back if we're at the first entry
      throw new DOMException("InvalidStateError");
    }

    const backEntry = this.entries[entryIndex - 1];
    return this.changeCurrentEntry(backEntry, navigationOptions);
  }

  async forward(navigationOptions?: AppHistoryNavigationOptions) {
    const entryIndex = this.entries.findIndex(
      (entry) => entry.key === this.current.key
    );
    if (entryIndex === this.entries.length - 1) {
      // cannot go forward if we're at the last entry
      throw new DOMException("InvalidStateError");
    }

    const forwardEntry = this.entries[entryIndex + 1];
    return this.changeCurrentEntry(forwardEntry, navigationOptions);
  }

  private async changeCurrentEntry(
    newCurrent: AppHistoryEntry,
    navigationOptions?: AppHistoryNavigationOptions
  ) {
    const respondWithPromiseArray = this.sendNavigateEvent(
      newCurrent,
      navigationOptions?.navigateInfo
    );

    const previousEntry = this.current;
    previousEntry.__fireEventListenersForEvent("navigatefrom");
    this.current = newCurrent;

    this.canGoBack = this.current.index > 0;
    this.canGoForward = this.current.index < this.entries.length - 1;

    const oldTransition = this.transition;
    this.transition = new AppHistoryTransition({
      type: "traverse",
      from: previousEntry,
    });

    newCurrent.__fireEventListenersForEvent("navigateto");

    if (oldTransition) {
      // we fire the abort here for previous entry.
      // which causes the handler below to fire
      previousEntry.__fireAbortForAssociatedEvent();
    }

    let thisEntrysAbortError: DOMException | undefined;
    newCurrent.__getAssociatedAbortSignal()?.addEventListener(
      "abort",
      () => {
        thisEntrysAbortError = new DOMException(
          `A new entry was added before the promises passed to respondWith() resolved for entry with url ${newCurrent.url}`,
          "AbortError"
        );
        this.sendNavigateErrorEvent(thisEntrysAbortError);

        // reject oldTransition.finished with abort error
        oldTransition?.__fireFinished(thisEntrysAbortError);
      },
      { once: true }
    );

    return Promise.all(respondWithPromiseArray)
      .then(() => {
        if (thisEntrysAbortError) {
          throw thisEntrysAbortError;
        }
        this.transition?.__fireFinished();
        this.transition = undefined;

        newCurrent.__fireEventListenersForEvent("finish");

        this.sendNavigateSuccessEvent();
      })
      .catch((error) => {
        if (error && error === thisEntrysAbortError) {
          // abort errors don't change finished or fire the finish event. the navigateError event was already fired
          throw error;
        }
        this.transition?.__fireFinished(error);
        this.transition = undefined;

        newCurrent.__fireEventListenersForEvent("finish");

        this.sendNavigateErrorEvent(error);
        throw error;
      });
  }

  private sendNavigateEvent(
    destinationEntry: AppHistoryEntry,
    info?: unknown
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
          destinationEntry.sameDocument = true;
          respondWithResponses.push(respondWithPromise);
        } else {
          throw new DOMException(
            "Cannot call AppHistoryNavigateEvent.respondWith() if AppHistoryNavigateEvent.canRespond is false",
            "SecurityError"
          );
        }
      },
    });

    // associate the event to the entry so that we can call the abort controller if necessary in the future
    destinationEntry.__associateNavigateEvent(navigateEvent);

    this.eventListeners.navigate.forEach((listener) => {
      try {
        listener.call(this, navigateEvent);
      } catch (error) {
        setTimeout(() => {
          throw error;
        });
      }
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
      } catch (error) {
        setTimeout(() => {
          throw error;
        });
      }
    });
  }

  private sendNavigateSuccessEvent() {
    this.eventListeners.navigatesuccess.forEach((listener) => {
      try {
        listener(new CustomEvent("TODO figure out the correct event"));
      } catch (error) {
        setTimeout(() => {
          throw error;
        });
      }
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
      } catch (error) {
        setTimeout(() => {
          throw error;
        });
      }
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
    this.id = fakeRandomId();
    this.index = -1;

    const upcomingUrl =
      options?.url ?? previousEntry?.url ?? window.location.pathname;
    this.url = upcomingUrl;

    const upcomingUrlObj = new URL(
      upcomingUrl,
      window.location.origin + window.location.pathname
    );
    this.sameDocument =
      upcomingUrlObj.origin === window.location.origin &&
      upcomingUrlObj.pathname === window.location.pathname;
  }

  key: AppHistoryEntryKeyOrId;
  id: AppHistoryEntryKeyOrId;
  url: string;
  sameDocument: boolean;
  index: number;
  private _state: unknown;
  private latestNavigateEvent?: AppHistoryNavigateEvent;

  private eventListeners: AppHistoryEntryEventListeners = {
    navigateto: [],
    navigatefrom: [],
    dispose: [],
    finish: [],
  };

  /** Provides a JSON.parse(JSON.stringify()) copy of the Entry's state.  */
  getState(): unknown {
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

  /** DO NOT USE; use appHistory.navigate() instead */
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

    this.id = fakeRandomId();
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
      } catch (error) {
        setTimeout(() => {
          throw error;
        });
      }
    });
  }

  /** DO NOT USE; for internal purposes only */
  __associateNavigateEvent(event: AppHistoryNavigateEvent): void {
    this.latestNavigateEvent = event;
  }

  /** DO NOT USE; for internal purposes only */
  __fireAbortForAssociatedEvent(): void {
    this.latestNavigateEvent?.__abort();
  }

  /** DO NOT USE; for internal purposes only */
  __getAssociatedAbortSignal(): AbortSignal | undefined {
    return this.latestNavigateEvent?.signal;
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

type UpdatePushParam1Types = string | AppHistoryPushOrUpdateFullOptions;

export type AppHistoryEntryKeyOrId = string;

interface AppHistoryNavigationOptions {
  navigateInfo?: unknown;
}

interface AppHistoryNavigateOptions extends AppHistoryNavigationOptions {
  state?: unknown;
  replace?: boolean;
}

interface AppHistoryPushOrUpdateFullOptions extends AppHistoryNavigateOptions {
  url?: string;
}

interface AppHistoryNavigateEventOptions extends EventInit {
  userInitiated: boolean;
  hashChange: boolean;
  destination: AppHistoryEntry;
  formData?: null;
  info: unknown;
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
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
  }
  readonly userInitiated: boolean;
  readonly hashChange: boolean;
  readonly destination: AppHistoryEntry;
  readonly formData?: null;
  readonly info: unknown;
  readonly canRespond: boolean;
  respondWith: (respondWithPromise: Promise<undefined>) => void;
  readonly signal: AbortSignal;
  private abortController: AbortController;

  /** DO NOT USE; for internal purposes only */
  __abort(): void {
    this.abortController.abort();
  }
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

type AppHistoryNavigationType = "replace" | "push" | "traverse";
class AppHistoryTransition {
  constructor({
    type,
    from,
  }: {
    type: AppHistoryNavigationType;
    from: AppHistoryEntry;
  }) {
    this.type = type;
    this.from = from;
    this.finished = new Promise((resolve, reject) => {
      this.finishedResolveReject = { resolve, reject };
    });
  }

  type: AppHistoryNavigationType;
  from: AppHistoryEntry;
  finished: Promise<undefined>;
  private finishedResolveReject?: {
    resolve: (value: PromiseLike<undefined> | undefined) => void;
    reject: (reason: unknown) => void;
  };
  rollback(): Promise<undefined> {
    return Promise.resolve(undefined);
  }

  /** DO NOT USE; for internal purposes only */
  __fireFinished(rejectionReason?: unknown): void {
    if (rejectionReason) {
      this.finishedResolveReject?.reject(rejectionReason);
    } else {
      this.finishedResolveReject?.resolve(undefined);
    }
  }
}

function isAppHistoryNavigateEventListener(
  eventName: keyof AppHistoryEventListeners,
  listener: AppHistoryNavigateEventListener | EventListener
): listener is AppHistoryNavigateEventListener {
  return eventName === "navigate";
}
