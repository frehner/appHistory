import { AppHistory } from "./appHistory";

describe("appHistory constructor", () => {
  it("should initialize with a current and entries", () => {
    const appHistory = new AppHistory();

    expect(appHistory.current).not.toBeUndefined();
    expect(appHistory.current).not.toBeNull();
    expect(appHistory.entries.length).toBe(1);
    expect(appHistory.entries[0]).toEqual(appHistory.current);
    expect(appHistory.canGoBack).toBe(false);
    expect(appHistory.canGoForward).toBe(false);
  });
});

describe("update", () => {
  it("only url: updates url but not the state", async () => {
    const appHistory = new AppHistory();
    await appHistory.update({ state: "test" });

    const { url: oldUrl } = appHistory.current;
    const oldState = appHistory.current.getState();

    const updatedUrl = "/newUrl";
    await appHistory.update({ url: updatedUrl });

    const { url: newUrl } = appHistory.current;
    const newState = appHistory.current.getState();

    expect(oldUrl).not.toEqual(newUrl);
    expect(oldState).toEqual(newState);
    expect(newUrl).toEqual(updatedUrl);
  });

  it("only state: updates state but not the url", async () => {
    const appHistory = new AppHistory();

    const { url: oldUrl } = appHistory.current;
    const oldState = appHistory.current.getState();

    const updatedState = "newState";
    await appHistory.update({ state: updatedState });

    const { url: newUrl } = appHistory.current;
    const newState = appHistory.current.getState();

    expect(oldUrl).toEqual(newUrl);
    expect(oldState).not.toEqual(newState);
    expect(newState).toEqual(updatedState);
  });

  it("can null out the state", async () => {
    const appHistory = new AppHistory();
    await appHistory.update({ state: "before" });

    const oldState = appHistory.current.getState();

    const updatedState = null;
    await appHistory.update({ state: updatedState });

    const newState = appHistory.current.getState();

    expect(oldState).not.toEqual(newState);
    expect(newState).toEqual(updatedState);
  });

  it("can update both state and url at the same time", async () => {
    const appHistory = new AppHistory();

    const { url: oldUrl } = appHistory.current;
    const oldState = appHistory.current.getState();

    const updatedState = "newState";
    const updatedUrl = "/newUrl";
    await appHistory.update({ state: updatedState, url: updatedUrl });

    const { url: newUrl } = appHistory.current;
    const newState = appHistory.current.getState();

    expect(oldUrl).not.toEqual(newUrl);
    expect(oldState).not.toEqual(newState);

    expect(newUrl).toEqual(updatedUrl);
    expect(newState).toEqual(updatedState);
  });

  it("does not add a new entry to the entries list", async () => {
    const appHistory = new AppHistory();

    const oldEntries = appHistory.entries;

    const newState = "newState";
    await appHistory.update({ state: newState });

    const newEntries = appHistory.entries;

    expect(oldEntries).toBe(newEntries);
    expect(oldEntries.length).toBe(newEntries.length);
    expect(newEntries[0].getState()).toEqual(newState);
  });

  it("should update the current entry, no matter the location of current in the entry list", async () => {
    const appHistory = new AppHistory();

    // add some entries
    await appHistory.push({ url: "/test1" });
    const test1 = appHistory.current;
    await appHistory.push({ url: "/test2" });

    await appHistory.back();
    expect(test1).toEqual(appHistory.current);

    await appHistory.update({ url: "/newTest1" });

    expect(appHistory.entries.map((entry) => entry.url)).toEqual([
      "TODO FIX DEFAULT URL",
      "/newTest1",
      "/test2",
    ]);
  });

  it("should update the current entry with passed in options, but keep the remaining properties of the current entry", async () => {
    const appHistory = new AppHistory();
    const key1 = appHistory.current.key;

    // add some entries
    await appHistory.push({ url: "/test1" });
    const key2 = appHistory.current.key;
    await appHistory.push({ url: "/test2" });
    const key3 = appHistory.current.key;

    await appHistory.back();
    expect(key2).toEqual(appHistory.current.key);

    await appHistory.update({ url: "/newTest1" });

    expect(appHistory.entries.map((entry) => entry.key)).toEqual([
      key1,
      key2,
      key3,
    ]);
    expect(appHistory.current.url).toBe("/newTest1");
  });

  it.todo(
    "should not allow 'update()' with no params. https://github.com/WICG/app-history/issues/52"
  );
});

describe("push", () => {
  it("no options: adds an entry with the same url but null-ed out state", async () => {
    const appHistory = new AppHistory();
    await appHistory.update({ state: "test" });
    const oldEntry = appHistory.current;

    await appHistory.push();

    expect(appHistory.current.getState()).toBeNull();
    expect(appHistory.current.getState()).not.toEqual(oldEntry.getState());
    expect(appHistory.entries.length).toBe(2);
  });

  it("should take in a url and options as two params", async () => {
    const appHistory = new AppHistory();
    await appHistory.push("/newUrl", { state: "newState" });

    expect(appHistory.current.url).toBe("/newUrl");
    expect(appHistory.current.getState()).toBe("newState");
  });

  it.todo(
    "should take in a callback function that can return AppHistoryEntryFullOptions. Skipping for now because of unclear spec"
  );

  it("only state: should overwrite the state and copy the previous URL", async () => {
    const appHistory = new AppHistory();
    const oldEntry = appHistory.current;

    const newState = "newState";
    await appHistory.push({ state: newState });

    expect(appHistory.current.getState()).toEqual(newState);
    expect(appHistory.current.getState()).not.toEqual(oldEntry.getState());
    expect(appHistory.current.url).toEqual(oldEntry.url);
    expect(appHistory.entries.length).toBe(2);
  });

  it("only url: should set a new url and null out the state", async () => {
    const appHistory = new AppHistory();
    await appHistory.update({ state: "test" });
    const oldEntry = appHistory.current;

    const newUrl = "newUrl";
    await appHistory.push({ url: newUrl });

    expect(appHistory.current.url).toEqual(newUrl);
    expect(appHistory.current.url).not.toEqual(oldEntry.url);
    expect(appHistory.current.getState()).not.toEqual(oldEntry.getState());
    expect(appHistory.current.getState()).toBeNull();
    expect(appHistory.entries.length).toBe(2);
  });

  it("updates both state and url", async () => {
    const appHistory = new AppHistory();
    const oldEntry = appHistory.current;

    const newUrl = "newUrl";
    const newState = "test";
    await appHistory.push({ url: newUrl, state: newState });

    expect(appHistory.current.url).toEqual(newUrl);
    expect(appHistory.current.url).not.toEqual(oldEntry.url);
    expect(appHistory.current.getState()).toEqual(newState);
    expect(appHistory.current.getState()).not.toEqual(oldEntry.getState());
    expect(appHistory.entries.length).toBe(2);
  });

  it("should add to the end of the entries stack", async () => {
    const appHistory = new AppHistory();
    await appHistory.push({ url: "/temp1" });
    await appHistory.push({ url: "/temp2" });

    // this test will have to change when I actually put in a sane url in the constructor
    expect(appHistory.entries.map((entry) => entry.url)).toEqual([
      "TODO FIX DEFAULT URL",
      "/temp1",
      "/temp2",
    ]);
  });

  it("should remove future entries if the current entry is not the last one in the entry stack", async () => {
    const appHistory = new AppHistory();
    const goToEntryKey = appHistory.current.key;
    await appHistory.push({ url: "/temp1" });
    await appHistory.push({ url: "/temp2" });

    expect(appHistory.entries.length).toBe(3);

    await appHistory.navigateTo(goToEntryKey);

    expect(appHistory.entries.length).toBe(3);

    await appHistory.push({ url: "/temp3" });

    expect(appHistory.entries.length).toBe(2);
    expect(appHistory.current.url).toBe("/temp3");
    expect(appHistory.entries.map((entry) => entry.url)).toEqual([
      "TODO FIX DEFAULT URL",
      "/temp3",
    ]);
  });

  it("should always have an up-to-date index to indicate the location in the entires list", async () => {
    const appHistory = new AppHistory();

    expect(appHistory.current.index).toBe(0);

    await appHistory.push();

    expect(appHistory.current.index).toBe(1);

    await appHistory.push();

    expect(appHistory.current.index).toBe(2);

    expect(appHistory.entries.map((entry) => entry.index)).toEqual([0, 1, 2]);

    await appHistory.back();

    expect(appHistory.current.index).toBe(1);

    await appHistory.back();

    expect(appHistory.current.index).toBe(0);
    expect(appHistory.entries.map((entry) => entry.index)).toEqual([0, 1, 2]);

    await appHistory.push();
    expect(appHistory.current.index).toBe(1);
    expect(appHistory.entries.map((entry) => entry.index)).toEqual([0, 1]);
  });

  it("should update appHistory canGoBack and canGoForward", async () => {
    const appHistory = new AppHistory();
    await appHistory.push();

    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(false);
  });
});

describe("appHistory eventListeners", () => {
  describe("navigate", () => {
    it("should add an event listener", async (done) => {
      const appHistory = new AppHistory();

      appHistory.addEventListener("navigate", () => {
        done();
      });

      await appHistory.push();
    });

    it("should call navigate with an AppHistoryEventNavigateEvent object and current should update", async () => {
      const appHistory = new AppHistory();
      let navEventObject;
      appHistory.addEventListener("navigate", (evt) => {
        navEventObject = evt;
      });

      const newUrl = "/newUrl";
      await appHistory.push({ url: newUrl });

      expect(navEventObject instanceof CustomEvent).toBe(true);
      expect(navEventObject.detail.destination.url).toBe(newUrl);
      expect(appHistory.current.url).toBe(newUrl);
    });

    it("should throw a DOMException 'AbortError' if event.preventDefault() is called", async () => {
      const appHistory = new AppHistory();
      appHistory.addEventListener("navigate", (evt) => {
        evt.preventDefault();
      });

      const newUrl = "/newUrl";

      await expect(appHistory.push({ url: newUrl })).rejects.toThrow(
        DOMException
      );
      expect(appHistory.current.url).not.toEqual(newUrl);
    });

    it("should include the navigateInfo passed from 'update'", async () => {
      // currently skipping this test because of unclear spec requirements
      const appHistory = new AppHistory();

      let expectedInfo;

      appHistory.addEventListener("navigate", (evt) => {
        expectedInfo = evt.detail.info;
      });

      const navigateInfo = "test";

      await appHistory.update({ url: "/temp", navigateInfo });

      expect(expectedInfo).toBeTruthy();
      expect(expectedInfo).toEqual(navigateInfo);
    });

    it("should include the navigateInfo passed from 'push'", async () => {
      const appHistory = new AppHistory();

      let expectedInfo;

      appHistory.addEventListener("navigate", (evt) => {
        expectedInfo = evt.detail.info;
      });

      const navigateInfo = "test";

      await appHistory.push({ navigateInfo });

      expect(expectedInfo).toBeTruthy();
      expect(expectedInfo).toEqual(navigateInfo);
    });

    it("should handle if a listener throws and continue to call other listeners", async () => {
      const appHistory = new AppHistory();

      const listenerEvents = [];

      appHistory.addEventListener("navigate", () => {
        listenerEvents.push("1");
        throw new Error("test");
      });

      appHistory.addEventListener("navigate", () => {
        listenerEvents.push("2");
      });

      await appHistory.push();

      expect(listenerEvents).toEqual(["1", "2"]);
    });

    it.todo("things changed in https://github.com/WICG/app-history/pull/56");

    describe("respondWith", () => {
      it("should work if the promise resolves successfully", async () => {
        const appHistory = new AppHistory();
        appHistory.addEventListener("navigate", (evt) => {
          evt.detail.respondWith(Promise.resolve());
        });

        const newUrl = "/newUrl";
        await appHistory.push({ url: newUrl });

        expect(appHistory.current.url).toBe(newUrl);
      });

      it("should not navigate if the promise rejects", async () => {
        const appHistory = new AppHistory();

        let upcomingEntry;
        appHistory.addEventListener("navigate", (evt) => {
          upcomingEntry = evt.detail.destination;
          evt.detail.respondWith(Promise.reject());
        });

        const previousCurrent = appHistory.current;

        const newUrl = "/newUrl";
        await appHistory.push({ url: newUrl });

        expect(appHistory.current.url).not.toBe(newUrl);
        expect(appHistory.current).toEqual(previousCurrent);
        expect(appHistory.current).not.toEqual(upcomingEntry);
      });
    });
  });

  describe("currentchange", () => {
    it("should fire the currentchange event for push()", async () => {
      // https://github.com/WICG/app-history#current-entry-change-monitoring

      const appHistory = new AppHistory();

      let currentEvent = null;

      appHistory.addEventListener("curentchange", (event) => {
        currentEvent = event;
      });

      await appHistory.push();

      expect(currentEvent).toBeTruthy();
      expect(currentEvent.detail.startTime).toBeLessThan(
        currentEvent.timeStamp
      );
    });

    it("should fire the currentchange event for update()", async () => {
      const appHistory = new AppHistory();

      let currentEvent = null;

      appHistory.addEventListener("curentchange", (event) => {
        currentEvent = event;
      });

      await appHistory.update({ state: "newState" });

      expect(currentEvent).toBeTruthy();
      expect(currentEvent.detail.startTime).toBeLessThan(
        currentEvent.timeStamp
      );
    });

    it("should handle if a listener throws and continue to call other listeners", async () => {
      const appHistory = new AppHistory();

      const listenerEvents = [];

      appHistory.addEventListener("curentchange", () => {
        listenerEvents.push("1");
        throw new Error("test");
      });

      appHistory.addEventListener("curentchange", () => {
        listenerEvents.push("2");
      });

      await appHistory.push();

      expect(listenerEvents).toEqual(["1", "2"]);
    });
  });

  describe("other listeners", () => {
    it("should throw an error when a listener is added that we dont' support yet", () => {
      // not sure if throwing here will be a long-term thing, but for now it signals that I haven't implemented it yet
      const appHistory = new AppHistory();
      expect(() =>
        appHistory.addEventListener("notsupported", () => {})
      ).toThrow();
    });
  });
});

describe("appHistoryEntry eventListeners https://github.com/WICG/app-history#per-entry-events ", () => {
  describe("navigateto", () => {
    it("fires when the entry becomes current with 'appHistory.navigateto()'", async (done) => {
      const appHistory = new AppHistory();

      const oldCurrent = appHistory.current;
      oldCurrent.addEventListener("navigateto", () => {
        done();
      });

      await appHistory.push();
      await appHistory.navigateTo(oldCurrent.key);
    });

    it("fires when the entry becomes current with 'appHistory.back()'", async (done) => {
      const appHistory = new AppHistory();

      const oldCurrent = appHistory.current;
      oldCurrent.addEventListener("navigateto", () => {
        done();
      });

      await appHistory.push();
      await appHistory.back();
    });

    it("fires when the entry becomes current with 'appHistory.forward()'", async (done) => {
      const appHistory = new AppHistory();

      await appHistory.push();

      const oldCurrent = appHistory.current;
      oldCurrent.addEventListener("navigateto", () => {
        done();
      });

      await appHistory.back();
      await appHistory.forward();
    });
  });
  describe("navigatefrom", () => {
    it("fires when the entry leaves current with 'appHistory.navigateto()'", async (done) => {
      const appHistory = new AppHistory();
      const oldCurrent = appHistory.current;
      await appHistory.push();

      appHistory.current.addEventListener("navigatefrom", () => {
        done();
      });

      await appHistory.navigateTo(oldCurrent.key);
    });

    it("fires when the entry leaves current with 'appHistory.push()'", async (done) => {
      const appHistory = new AppHistory();

      appHistory.current.addEventListener("navigatefrom", () => {
        done();
      });

      await appHistory.push();
    });

    it("fires when the entry leaves current with 'appHistory.back()'", async (done) => {
      const appHistory = new AppHistory();
      await appHistory.push();

      appHistory.current.addEventListener("navigatefrom", () => {
        done();
      });

      await appHistory.back();
    });

    it("fires when the entry leaves current with 'appHistory.forward()'", async (done) => {
      const appHistory = new AppHistory();

      await appHistory.push();
      await appHistory.back();

      appHistory.current.addEventListener("navigatefrom", () => {
        done();
      });

      await appHistory.forward();
    });
  });
  describe("dispose", () => {
    it("fires when a entry is no longer reachable/in the entries list", async (done) => {
      const appHistory = new AppHistory();

      await appHistory.push();

      appHistory.current.addEventListener("dispose", () => {
        done();
      });

      await appHistory.back();
      await appHistory.push();
    });

    it("should have an index of -1 on the entry that's disposed", async (done) => {
      const appHistory = new AppHistory();

      await appHistory.push();

      appHistory.current.addEventListener("dispose", (evt) => {
        expect(evt.detail.target.index).toBe(-1);
        done();
      });

      await appHistory.back();
      await appHistory.push();
    });
  });
});

describe("navigateTo", () => {
  it("should throw an exception if the key is no longer in the entries list", async () => {
    const appHistory = new AppHistory();

    await expect(appHistory.navigateTo("non-existent-key")).rejects.toThrow(
      new DOMException("InvalidStateError")
    );
  });

  it("should update current but not add/remove anything from entries", async () => {
    const appHistory = new AppHistory();

    await appHistory.push({ url: "/test1" });
    const oldKey = appHistory.current.key;
    await appHistory.push({ url: "/test2" });

    expect(appHistory.current.url).toBe("/test2");

    await appHistory.navigateTo(oldKey);
    expect(appHistory.current.url).toBe("/test1");
    expect(appHistory.entries.length).toBe(3);
    expect(appHistory.current).not.toEqual(appHistory.entries[2]);
  });

  it("should update canGoBack and canGoForward", async () => {
    const appHistory = new AppHistory();
    await appHistory.push();
    await appHistory.push();

    await appHistory.navigateTo(appHistory.entries[0].key);
    expect(appHistory.canGoBack).toBe(false);
    expect(appHistory.canGoForward).toBe(true);

    await appHistory.navigateTo(appHistory.entries[1].key);
    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(true);

    await appHistory.navigateTo(appHistory.entries[2].key);
    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(false);
  });
});

describe("events order", () => {
  it.skip("should fire the events in order for push()", async () => {
    // https://github.com/WICG/app-history#complete-event-sequence
    const eventsList = [];

    const appHistory = new AppHistory();

    // add an entry that will be disposed of later
    await appHistory.push();

    // not needed for appHistory.push()?
    // appHistory.current.addEventListener("navigateto", () => {
    //   eventsList.push("current.navigateto");
    // });

    appHistory.current.addEventListener("dispose", () => {
      eventsList.push("entry.dispose");
    });

    await appHistory.back();

    appHistory.current.addEventListener("navigatefrom", () => {
      eventsList.push("entry.navigatefrom");
    });

    appHistory.addEventListener("navigate", () => {
      eventsList.push("navigate");
    });

    appHistory.addEventListener("curentchange", () => {
      eventsList.push("currentchange");
    });

    await appHistory.push();

    expect(eventsList).toEqual([
      "navigate",
      "entry.navigatefrom",
      "currentchange",
      "entry.dispose",
      "entry.finish",
      "navigatefinish",
    ]);
  });
});

describe("back", () => {
  it("should throw an exception if it cannot go back further", async () => {
    const appHistory = new AppHistory();

    await expect(appHistory.back()).rejects.toThrow(
      new DOMException("InvalidStateError")
    );
  });

  it("should update current but not add/remove anything from entries", async () => {
    const appHistory = new AppHistory();
    const firstUrl = appHistory.current.url;

    await appHistory.push({ url: "/test1" });
    await appHistory.push({ url: "/test2" });

    expect(appHistory.current.url).toBe("/test2");

    await appHistory.back();
    expect(appHistory.current.url).toBe("/test1");
    expect(appHistory.entries.length).toBe(3);
    expect(appHistory.current).toEqual(appHistory.entries[1]);

    await appHistory.back();
    expect(appHistory.current.url).toBe(firstUrl);
    expect(appHistory.entries.length).toBe(3);
    expect(appHistory.current).toEqual(appHistory.entries[0]);
  });

  it("should update canGoBack and canGoForward", async () => {
    const appHistory = new AppHistory();
    await appHistory.push();
    await appHistory.push();

    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(false);

    await appHistory.back();
    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(true);

    await appHistory.back();
    expect(appHistory.canGoBack).toBe(false);
    expect(appHistory.canGoForward).toBe(true);
  });
});

describe("forward", () => {
  it("should throw an exception if it cannot go forward because it's the last one", async () => {
    const appHistory = new AppHistory();

    await expect(appHistory.forward()).rejects.toThrow(
      new DOMException("InvalidStateError")
    );
  });

  it("should update current but not add/remove anything from entries", async () => {
    const appHistory = new AppHistory();
    const firstCurrent = appHistory.current;

    await appHistory.push({ url: "/test1" });
    await appHistory.push({ url: "/test2" });

    expect(appHistory.current.url).toBe("/test2");

    await appHistory.navigateTo(firstCurrent.key);
    expect(appHistory.current).toBe(firstCurrent);

    await appHistory.forward();
    expect(appHistory.current.url).toBe("/test1");
    expect(appHistory.entries.length).toBe(3);
    expect(appHistory.current).toEqual(appHistory.entries[1]);

    await appHistory.forward();
    expect(appHistory.current.url).toBe("/test2");
    expect(appHistory.entries.length).toBe(3);
    expect(appHistory.current).toEqual(appHistory.entries[2]);
  });

  it("should update canGoBack and canGoForward", async () => {
    const appHistory = new AppHistory();
    const firstEntry = appHistory.current;
    await appHistory.push();
    await appHistory.push();
    await appHistory.navigateTo(firstEntry.key);

    expect(appHistory.canGoBack).toBe(false);
    expect(appHistory.canGoForward).toBe(true);

    await appHistory.forward();
    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(true);

    await appHistory.forward();
    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(false);
  });
});

describe("AppHistoryEntry state", () => {
  it("should not provide the state property directly; you must use getState() instead", async () => {
    const appHistory = new AppHistory();
    await appHistory.update({ state: "newState" });
    expect(appHistory.current.state).toBe(undefined);
    expect(appHistory.current.getState()).toBe("newState");
  });

  it("should provide a copy of state, so if you change it it doesn't affect the entry", async () => {
    const appHistory = new AppHistory();
    await appHistory.push({ state: { test: "deep string" } });

    const state = appHistory.current.getState();
    expect(state).toEqual({ test: "deep string" });

    state.test = "changed";

    expect(appHistory.current.getState()).toEqual({ test: "deep string" });
  });
});
