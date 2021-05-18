import { AppHistory } from "./appHistory";

beforeEach(() => {
  window.history.pushState(null, null, "/");
});

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

describe("AppHistoryEntry constructor", () => {
  it("should correctly set 'sameDocument'", async () => {
    const appHistory = new AppHistory();
    expect(appHistory.current.sameDocument).toBe(true);

    await appHistory.navigate("/newUrl");
    expect(appHistory.current.sameDocument).toBe(false);

    await appHistory.navigate("/newUrl#test");
    expect(appHistory.current.sameDocument).toBe(true);

    await appHistory.navigate("#new-test");
    expect(appHistory.current.sameDocument).toBe(true);

    // any cross-document navigations are turned into same-document navigations if respondWith receives a promise
    let navigateEvent = null;
    appHistory.onnavigate = (evt) => {
      navigateEvent = evt;
      evt.respondWith(Promise.resolve());
    };
    await appHistory.navigate("/url2");
    expect(navigateEvent.destination.sameDocument).toBe(true);
    expect(appHistory.current.sameDocument).toBe(true);
    expect(appHistory.current.url).toBe("/url2");

    appHistory.onnavigate = null;

    MockLocation.mock();

    await appHistory.navigate("https://example.com");
    expect(appHistory.current.sameDocument).toBe(false);
    expect(window.location.assign.mock.calls.length).toBe(1);

    MockLocation.restore();
  });
});

describe("navigate with replace: true", () => {
  it("only url: updates url but not the state", async () => {
    const appHistory = new AppHistory();
    await appHistory.navigate({ state: "test", replace: true });

    const { url: oldUrl } = appHistory.current;
    const oldState = appHistory.current.getState();

    const updatedUrl = "/newUrl";
    await appHistory.navigate({ url: updatedUrl, replace: true });

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
    await appHistory.navigate({ state: updatedState, replace: true });

    const { url: newUrl } = appHistory.current;
    const newState = appHistory.current.getState();

    expect(oldUrl).toEqual(newUrl);
    expect(oldState).not.toEqual(newState);
    expect(newState).toEqual(updatedState);
  });

  it("can null out the state", async () => {
    const appHistory = new AppHistory();
    await appHistory.navigate({ state: "before", replace: true });

    const oldState = appHistory.current.getState();

    const updatedState = null;
    await appHistory.navigate({ state: updatedState, replace: true });

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
    await appHistory.navigate({
      state: updatedState,
      url: updatedUrl,
      replace: true,
    });

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
    await appHistory.navigate({ state: newState, replace: true });

    const newEntries = appHistory.entries;

    expect(oldEntries).toBe(newEntries);
    expect(oldEntries.length).toBe(newEntries.length);
    expect(newEntries[0].getState()).toEqual(newState);
  });

  it("should update the current entry, no matter the location of current in the entry list", async () => {
    const appHistory = new AppHistory();

    // add some entries
    await appHistory.navigate({ url: "/test1" });
    const test1 = appHistory.current;
    await appHistory.navigate({ url: "/test2" });

    await appHistory.back();
    expect(test1).toEqual(appHistory.current);

    await appHistory.navigate({ url: "/newTest1", replace: true });

    expect(appHistory.entries.map((entry) => entry.url)).toEqual([
      "http://localhost/",
      "/newTest1",
      "/test2",
    ]);
  });

  it("should update the current entry with passed in options, but keep the remaining properties of the current entry", async () => {
    const appHistory = new AppHistory();
    const key1 = appHistory.current.key;

    // add some entries
    await appHistory.navigate({ url: "/test1" });
    const key2 = appHistory.current.key;
    await appHistory.navigate({ url: "/test2" });
    const key3 = appHistory.current.key;

    await appHistory.back();
    expect(key2).toEqual(appHistory.current.key);

    await appHistory.navigate({ url: "/newTest1", replace: true });

    expect(appHistory.entries.map((entry) => entry.key)).toEqual([
      key1,
      key2,
      key3,
    ]);
    expect(appHistory.current.url).toBe("/newTest1");
  });

  it("should not allow navigate({replace: true}) with no other options", async () => {
    const appHistory = new AppHistory();
    await expect(appHistory.navigate({ replace: true })).rejects.toThrowError(
      "Must include more options than just {'replace: true'}"
    );
  });
});

describe("push", () => {
  it("no options: adds an entry with the same url but null-ed out state", async () => {
    const appHistory = new AppHistory();
    await appHistory.navigate({ state: "test", replace: true });
    const oldEntry = appHistory.current;

    await appHistory.navigate();

    expect(appHistory.current.getState()).toBeNull();
    expect(appHistory.current.getState()).not.toEqual(oldEntry.getState());
    expect(appHistory.entries.length).toBe(2);
  });

  it("should take in a url and options as two params", async () => {
    const appHistory = new AppHistory();
    await appHistory.navigate("/newUrl", { state: "newState" });

    expect(appHistory.current.url).toBe("/newUrl");
    expect(appHistory.current.getState()).toBe("newState");
  });

  it.todo("updates in https://github.com/WICG/app-history/pull/68/files");

  it("only state: should overwrite the state and copy the previous URL", async () => {
    const appHistory = new AppHistory();
    const oldEntry = appHistory.current;

    const newState = "newState";
    await appHistory.navigate({ state: newState });

    expect(appHistory.current.getState()).toEqual(newState);
    expect(appHistory.current.getState()).not.toEqual(oldEntry.getState());
    expect(appHistory.current.url).toEqual(oldEntry.url);
    expect(appHistory.entries.length).toBe(2);
  });

  it("only url: should set a new url and null out the state", async () => {
    const appHistory = new AppHistory();
    await appHistory.navigate({ state: "test", replace: true });
    const oldEntry = appHistory.current;

    const newUrl = "newUrl";
    await appHistory.navigate({ url: newUrl });

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
    await appHistory.navigate({ url: newUrl, state: newState });

    expect(appHistory.current.url).toEqual(newUrl);
    expect(appHistory.current.url).not.toEqual(oldEntry.url);
    expect(appHistory.current.getState()).toEqual(newState);
    expect(appHistory.current.getState()).not.toEqual(oldEntry.getState());
    expect(appHistory.entries.length).toBe(2);
  });

  it("should add to the end of the entries stack", async () => {
    const appHistory = new AppHistory();
    await appHistory.navigate({ url: "/temp1" });
    await appHistory.navigate({ url: "/temp2" });

    // this test will have to change when I actually put in a sane url in the constructor
    expect(appHistory.entries.map((entry) => entry.url)).toEqual([
      "http://localhost/",
      "/temp1",
      "/temp2",
    ]);
  });

  it("should remove future entries if the current entry is not the last one in the entry stack", async () => {
    const appHistory = new AppHistory();
    const goToEntryKey = appHistory.current.key;
    await appHistory.navigate({ url: "/temp1" });
    await appHistory.navigate({ url: "/temp2" });

    expect(appHistory.entries.length).toBe(3);

    await appHistory.goTo(goToEntryKey);

    expect(appHistory.entries.length).toBe(3);

    await appHistory.navigate({ url: "/temp3" });

    expect(appHistory.entries.length).toBe(2);
    expect(appHistory.current.url).toBe("/temp3");
    expect(appHistory.entries.map((entry) => entry.url)).toEqual([
      "http://localhost/",
      "/temp3",
    ]);
  });

  it("should always have an up-to-date index to indicate the location in the entires list", async () => {
    const appHistory = new AppHistory();

    expect(appHistory.current.index).toBe(0);

    await appHistory.navigate();

    expect(appHistory.current.index).toBe(1);

    await appHistory.navigate();

    expect(appHistory.current.index).toBe(2);

    expect(appHistory.entries.map((entry) => entry.index)).toEqual([0, 1, 2]);

    await appHistory.back();

    expect(appHistory.current.index).toBe(1);

    await appHistory.back();

    expect(appHistory.current.index).toBe(0);
    expect(appHistory.entries.map((entry) => entry.index)).toEqual([0, 1, 2]);

    await appHistory.navigate();
    expect(appHistory.current.index).toBe(1);
    expect(appHistory.entries.map((entry) => entry.index)).toEqual([0, 1]);
  });

  it("should update appHistory canGoBack and canGoForward", async () => {
    const appHistory = new AppHistory();
    await appHistory.navigate();

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

      await appHistory.navigate();
    });

    it("should call navigate with an AppHistoryEventNavigateEvent object and current should update", async () => {
      const appHistory = new AppHistory();
      let navEventObject;
      appHistory.addEventListener("navigate", (evt) => {
        navEventObject = evt;
      });

      const newUrl = "/newUrl";
      await appHistory.navigate({ url: newUrl });

      expect(navEventObject instanceof Event).toBe(true);
      expect(navEventObject.destination.url).toBe(newUrl);
      expect(appHistory.current.url).toBe(newUrl);
    });

    it("should throw a DOMException 'AbortError' if event.preventDefault() is called", async () => {
      const appHistory = new AppHistory();
      appHistory.addEventListener("navigate", (evt) => {
        evt.preventDefault();
      });

      const newUrl = "/newUrl";

      await expect(appHistory.navigate({ url: newUrl })).rejects.toThrow(
        DOMException
      );
      expect(appHistory.current.url).not.toEqual(newUrl);
    });

    it("should include the navigateInfo passed from navigation with replace:true", async () => {
      // currently skipping this test because of unclear spec requirements
      const appHistory = new AppHistory();

      let expectedInfo;

      appHistory.addEventListener("navigate", (evt) => {
        expectedInfo = evt.info;
      });

      const navigateInfo = "test";

      await appHistory.navigate({ url: "/temp", navigateInfo, replace: true });

      expect(expectedInfo).toBeTruthy();
      expect(expectedInfo).toEqual(navigateInfo);
    });

    it("should include the navigateInfo from navigation'", async () => {
      const appHistory = new AppHistory();

      let expectedInfo;

      appHistory.addEventListener("navigate", (evt) => {
        expectedInfo = evt.info;
      });

      const navigateInfo = "test";

      await appHistory.navigate({ navigateInfo });

      expect(expectedInfo).toBeTruthy();
      expect(expectedInfo).toEqual(navigateInfo);
    });

    it.skip("should handle if a listener throws and continue to call other listeners", async () => {
      const appHistory = new AppHistory();

      const listenerEvents = [];

      appHistory.addEventListener("navigate", () => {
        listenerEvents.navigate("1");
        throw new Error("test");
      });

      appHistory.addEventListener("navigate", () => {
        listenerEvents.navigate("2");
      });

      expect(listenerEvents).toEqual(["1", "2"]);
    });

    it("should only allow one event listener for 'onnavigate' at a time", async () => {
      const appHistory = new AppHistory();

      let timesCalled = 0;

      appHistory.onnavigate = () => {
        timesCalled++;
      };

      appHistory.onnavigate = () => {
        timesCalled++;
      };

      await appHistory.navigate();

      expect(timesCalled).toBe(1);
    });

    it("should set 'hashChange' to false if it's cross-document", async (done) => {
      const appHistory = new AppHistory();
      await appHistory.navigate("/path");

      appHistory.addEventListener("navigate", (evt) => {
        expect(evt.hashChange).toBe(false);
        done();
      });

      await appHistory.navigate("/otherPath");
    });

    it("should set 'hashChange' to true if it's same-document", async (done) => {
      const appHistory = new AppHistory();
      await appHistory.navigate("/broken");

      appHistory.addEventListener("navigate", (evt) => {
        expect(evt.hashChange).toBe(true);
        done();
      });

      await appHistory.navigate("/broken#test");
    });

    it("should set 'hashChange' to false if it's same-document but only query param changed", async (done) => {
      const appHistory = new AppHistory();
      await appHistory.navigate("/path#test");

      appHistory.addEventListener("navigate", (evt) => {
        expect(evt.hashChange).toBe(false);
        done();
      });

      await appHistory.navigate("/path?search=new#test");
    });

    it.skip("should throw a SecurityError DOMError if you use respondWith() when canRespond=false", async (done) => {
      const appHistory = new AppHistory();

      appHistory.addEventListener("navigate", (evt) => {
        expect(evt.canRespond).toBe(false);
        expect(() => evt.respondWith(Promise.resolve())).rejects.toThrowError(
          new DOMException()
        );
        done();
      });

      window.onerror = (err) => {
        console.log("caught");
      };

      MockLocation.mock();
      await appHistory.navigate("https://example.com");
      MockLocation.restore();
    });

    it("should have a signal that isn't aborted by default", async (done) => {
      const appHistory = new AppHistory();

      appHistory.onnavigate = (evt) => {
        expect(evt.signal.aborted).toBe(false);
        done();
      };

      await appHistory.navigate("/test");
    });

    it("should fire abort if another push event happened while the previous respondWith promise is in flight", async (done) => {
      const appHistory = new AppHistory();

      let timesCalled = 0;
      appHistory.onnavigate = (evt) => {
        evt.respondWith(
          (async () => {
            if (timesCalled === 0) {
              timesCalled++;
              await new Promise((resolve) => setTimeout(resolve, 10));
              expect(evt.signal.aborted).toBe(true);
              expect(timesCalled).toBe(2);
              done();
            } else {
              timesCalled++;
            }
          })()
        );
      };

      let slowEntry;
      try {
        // intentionally don't call await here so we can fire the next push before this one finishes
        // however, the promise will reject, so we need to handle that
        const slowPromise = appHistory.navigate("/slowUrl");
        slowEntry = appHistory.current;
        expect(appHistory.transition).toBeTruthy();

        await new Promise((resolve) => setTimeout(resolve));
        await appHistory.navigate("/newerUrl");
        expect(appHistory.current.url).toBe("/newerUrl");

        await slowPromise;
      } catch (error) {
        expect(error).toBeInstanceOf(DOMException);
        expect(slowEntry.transition).toBeFalsy();
      }
    });

    it.todo("add a case for when search params come after the hash?");

    it.todo(
      "all the 'canRespond' cases from https://github.com/WICG/app-history#appendix-types-of-navigations"
    );

    describe("respondWith", () => {
      it("should work if the promise resolves successfully", async () => {
        const appHistory = new AppHistory();
        appHistory.addEventListener("navigate", (evt) => {
          evt.respondWith(Promise.resolve());
        });

        const newUrl = "/newUrl";
        await appHistory.navigate({ url: newUrl });

        expect(appHistory.current.url).toBe(newUrl);
      });

      it("should navigate even if the promise rejects", async () => {
        const appHistory = new AppHistory();

        let upcomingEntry;
        appHistory.addEventListener("navigate", (evt) => {
          upcomingEntry = evt.destination;
          evt.respondWith(Promise.reject());
        });

        const newUrl = "/newUrl";

        try {
          await appHistory.navigate({ url: newUrl });
        } catch (error) {}

        expect(appHistory.current.url).toBe(newUrl);
        expect(appHistory.current).toEqual(upcomingEntry);
      });
    });
  });

  describe("currentchange", () => {
    it("should fire the currentchange event for navigate()", async () => {
      // https://github.com/WICG/app-history#current-entry-change-monitoring

      const appHistory = new AppHistory();

      let currentEvent = null;

      appHistory.addEventListener("currentchange", (event) => {
        currentEvent = event;
      });

      await appHistory.navigate();

      expect(currentEvent).toBeTruthy();
      expect(currentEvent.startTime).toBeLessThan(currentEvent.timeStamp);
    });

    it("should fire the currentchange event for update()", async () => {
      const appHistory = new AppHistory();

      let currentEvent = null;

      appHistory.addEventListener("currentchange", (event) => {
        currentEvent = event;
      });

      await appHistory.navigate({ state: "newState", replace: true });

      expect(currentEvent).toBeTruthy();
      expect(currentEvent.startTime).toBeLessThan(currentEvent.timeStamp);
    });

    it.skip("should handle if a listener throws and continue to call other listeners", async () => {
      const appHistory = new AppHistory();

      const listenerEvents = [];

      appHistory.addEventListener("currentchange", () => {
        listenerEvents.push("1");
        throw new Error("test");
      });

      appHistory.addEventListener("currentchange", () => {
        listenerEvents.push("2");
      });

      await appHistory.navigate();

      expect(listenerEvents).toEqual(["1", "2"]);
    });

    it("should only allow one event listener for 'currentchange' at a time", async () => {
      const appHistory = new AppHistory();

      let timesCalled = 0;

      appHistory.oncurrentchange = () => {
        timesCalled++;
      };

      appHistory.oncurrentchange = () => {
        timesCalled++;
      };

      await appHistory.navigate();

      expect(timesCalled).toBe(1);
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

describe("appHistoryEntry keys and IDs", () => {
  describe("keys", () => {
    it("should stay the same even if an appHistoryEntry changes", async () => {
      const appHistory = new AppHistory();
      const oldKey = appHistory.current.key;
      await appHistory.navigate({ replace: true, state: {} });
      expect(oldKey).toEqual(appHistory.current.key);
    });
  });

  describe("IDs", () => {
    it("should be unique even if replaced", async () => {
      const appHistory = new AppHistory();
      const oldId = appHistory.current.id;
      await appHistory.navigate({ replace: true, state: {} });
      expect(oldId).not.toEqual(appHistory.current.id);
    });

    it("should be unique across additions", async () => {
      const appHistory = new AppHistory();
      const oldId = appHistory.current.id;
      await appHistory.navigate("/newUrl");
      expect(oldId).not.toEqual(appHistory.current.id);
    });
  });
});

describe("appHistoryEntry eventListeners https://github.com/WICG/app-history#per-entry-events ", () => {
  describe("navigateto", () => {
    it("fires when the entry becomes current with 'appHistory.goTo()'", async (done) => {
      const appHistory = new AppHistory();

      const oldCurrent = appHistory.current;
      oldCurrent.addEventListener("navigateto", () => {
        done();
      });

      await appHistory.navigate();
      await appHistory.goTo(oldCurrent.key);
    });

    it("fires when the entry becomes current with 'appHistory.back()'", async (done) => {
      const appHistory = new AppHistory();

      const oldCurrent = appHistory.current;
      oldCurrent.addEventListener("navigateto", () => {
        done();
      });

      await appHistory.navigate();
      await appHistory.back();
    });

    it("fires when the entry becomes current with 'appHistory.forward()'", async (done) => {
      const appHistory = new AppHistory();

      await appHistory.navigate();

      const oldCurrent = appHistory.current;
      oldCurrent.addEventListener("navigateto", () => {
        done();
      });

      await appHistory.back();
      await appHistory.forward();
    });
  });
  describe("navigatefrom", () => {
    it("fires when the entry leaves current with 'appHistory.goTo()'", async (done) => {
      const appHistory = new AppHistory();
      const oldCurrent = appHistory.current;
      await appHistory.navigate();

      appHistory.current.addEventListener("navigatefrom", () => {
        done();
      });

      await appHistory.goTo(oldCurrent.key);
    });

    it("fires when the entry leaves current with 'appHistory.navigate()'", async (done) => {
      const appHistory = new AppHistory();

      appHistory.current.addEventListener("navigatefrom", () => {
        done();
      });

      await appHistory.navigate();
    });

    it("fires when the entry leaves current with 'appHistory.back()'", async (done) => {
      const appHistory = new AppHistory();
      await appHistory.navigate();

      appHistory.current.addEventListener("navigatefrom", () => {
        done();
      });

      await appHistory.back();
    });

    it("fires when the entry leaves current with 'appHistory.forward()'", async (done) => {
      const appHistory = new AppHistory();

      await appHistory.navigate();
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

      await appHistory.navigate();

      appHistory.current.addEventListener("dispose", () => {
        done();
      });

      await appHistory.back();
      await appHistory.navigate();
    });

    it("should have an index of -1 on the entry that's disposed", async (done) => {
      const appHistory = new AppHistory();

      await appHistory.navigate();

      appHistory.current.addEventListener("dispose", (evt) => {
        expect(evt.detail.target.index).toBe(-1);
        done();
      });

      await appHistory.back();
      await appHistory.navigate();
    });
  });

  describe("finish", () => {
    it("should fire finish on successful push navigation", async (done) => {
      const appHistory = new AppHistory();

      appHistory.onnavigate = (evt) => {
        evt.respondWith(
          new Promise((resolve) => {
            setTimeout(resolve, 10);
          })
        );
      };

      const pushPromise = appHistory.navigate("/newUrl");

      appHistory.current.addEventListener("finish", () => {
        done();
      });

      await pushPromise;
    });
  });
});

describe("goTo", () => {
  it("should throw an exception if the key is no longer in the entries list", async () => {
    const appHistory = new AppHistory();

    await expect(appHistory.goTo("non-existent-key")).rejects.toThrow(
      new DOMException("InvalidStateError")
    );
  });

  it("should update current but not add/remove anything from entries", async () => {
    const appHistory = new AppHistory();

    await appHistory.navigate({ url: "/test1" });
    const oldKey = appHistory.current.key;
    await appHistory.navigate({ url: "/test2" });

    expect(appHistory.current.url).toBe("/test2");

    await appHistory.goTo(oldKey);
    expect(appHistory.current.url).toBe("/test1");
    expect(appHistory.entries.length).toBe(3);
    expect(appHistory.current).not.toEqual(appHistory.entries[2]);
  });

  it("should update canGoBack and canGoForward", async () => {
    const appHistory = new AppHistory();
    await appHistory.navigate();
    await appHistory.navigate();

    await appHistory.goTo(appHistory.entries[0].key);
    expect(appHistory.canGoBack).toBe(false);
    expect(appHistory.canGoForward).toBe(true);

    await appHistory.goTo(appHistory.entries[1].key);
    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(true);

    await appHistory.goTo(appHistory.entries[2].key);
    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(false);
  });

  it("should allow 'navigateInfo' as a param and pass that through to the navigate event", async (done) => {
    const appHistory = new AppHistory();
    const oldKey = appHistory.current.key;

    await appHistory.navigate();

    appHistory.addEventListener("navigate", (evt) => {
      expect(evt.info).toBe("navigateToCalled");
      done();
    });

    await appHistory.goTo(oldKey, { navigateInfo: "navigateToCalled" });
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

    await appHistory.navigate({ url: "/test1" });
    await appHistory.navigate({ url: "/test2" });

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
    await appHistory.navigate();
    await appHistory.navigate();

    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(false);

    await appHistory.back();
    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(true);

    await appHistory.back();
    expect(appHistory.canGoBack).toBe(false);
    expect(appHistory.canGoForward).toBe(true);
  });

  it("should allow 'navigateInfo' as a param and pass that through to the navigate event", async (done) => {
    const appHistory = new AppHistory();

    await appHistory.navigate();

    appHistory.addEventListener("navigate", (evt) => {
      expect(evt.info).toBe("backCalled");
      done();
    });

    await appHistory.back({ navigateInfo: "backCalled" });
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

    await appHistory.navigate({ url: "/test1" });
    await appHistory.navigate({ url: "/test2" });

    expect(appHistory.current.url).toBe("/test2");

    await appHistory.goTo(firstCurrent.key);
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
    await appHistory.navigate();
    await appHistory.navigate();
    await appHistory.goTo(firstEntry.key);

    expect(appHistory.canGoBack).toBe(false);
    expect(appHistory.canGoForward).toBe(true);

    await appHistory.forward();
    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(true);

    await appHistory.forward();
    expect(appHistory.canGoBack).toBe(true);
    expect(appHistory.canGoForward).toBe(false);
  });

  it("should allow 'navigateInfo' as a param and pass that through to the navigate event", async (done) => {
    const appHistory = new AppHistory();

    await appHistory.navigate();
    await appHistory.back();

    appHistory.addEventListener("navigate", (evt) => {
      expect(evt.info).toBe("forwardCalled");
      done();
    });

    await appHistory.forward({ navigateInfo: "forwardCalled" });
  });
});

describe("AppHistoryEntry state", () => {
  it("should not provide the state property directly; you must use getState() instead", async () => {
    const appHistory = new AppHistory();
    await appHistory.navigate({ state: "newState", replace: true });
    expect(appHistory.current.state).toBe(undefined);
    expect(appHistory.current.getState()).toBe("newState");
  });

  it("should provide a copy of state, so if you change it it doesn't affect the entry", async () => {
    const appHistory = new AppHistory();
    await appHistory.navigate({ state: { test: "deep string" } });

    const state = appHistory.current.getState();
    expect(state).toEqual({ test: "deep string" });

    state.test = "changed";

    expect(appHistory.current.getState()).toEqual({ test: "deep string" });
  });
});

describe("appHistory.transition", () => {
  it("should not exist when no transition is happening", async () => {
    const appHistory = new AppHistory();
    expect(appHistory.transition).toBe(undefined);
    appHistory.addEventListener("navigate", (evt) => {
      evt.respondWith(Promise.resolve());
    });
    await appHistory.navigate("newUrl");
    expect(appHistory.transition).toBe(undefined);
  });

  it("should exist on push-like navigations", async () => {
    const appHistory = new AppHistory();
    expect(appHistory.transition).toBe(undefined);
    appHistory.addEventListener("navigate", (evt) => {
      evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
    });
    const navigationPromise = appHistory.navigate("newUrl");
    expect(appHistory.transition).toBeTruthy();

    await navigationPromise;
    expect(appHistory.transition).toBe(undefined);
  });

  it("should exist on replace-like navigations", async () => {
    const appHistory = new AppHistory();
    expect(appHistory.transition).toBe(undefined);
    appHistory.addEventListener("navigate", (evt) => {
      evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
    });
    const navigationPromise = appHistory.navigate({ replace: true, state: {} });
    expect(appHistory.transition).toBeTruthy();

    await navigationPromise;
    expect(appHistory.transition).toBe(undefined);
  });

  describe("transition type", () => {
    it("should be set to 'push' on push-like navigations", async () => {
      const appHistory = new AppHistory();

      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      const navigationPromise = appHistory.navigate("/newUrl");

      expect(appHistory.transition.type).toBe("push");

      await navigationPromise;
    });

    it("should be set to 'replace' on replace-like navigations", async () => {
      const appHistory = new AppHistory();

      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      const navigationPromise = appHistory.navigate({
        replace: true,
        state: {},
      });

      expect(appHistory.transition.type).toBe("replace");

      await navigationPromise;
    });

    it("should be set to 'traverse' on goTo()", async () => {
      const appHistory = new AppHistory();
      const firstKey = appHistory.current.key;

      await appHistory.navigate("/newUrl");

      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      const navigationPromise = appHistory.goTo(firstKey);

      expect(appHistory.transition.type).toBe("traverse");

      await navigationPromise;
    });

    it("should be set to 'traverse' on forward()", async () => {
      const appHistory = new AppHistory();

      await appHistory.navigate("/newUrl");
      await appHistory.back();

      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      const navigationPromise = appHistory.forward();

      expect(appHistory.transition.type).toBe("traverse");

      await navigationPromise;
    });

    it("should be set to 'traverse' on back()", async () => {
      const appHistory = new AppHistory();

      await appHistory.navigate("/newUrl");

      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      const navigationPromise = appHistory.back();

      expect(appHistory.transition.type).toBe("traverse");

      await navigationPromise;
    });
  });

  describe("transition from", () => {
    it("should correctly set the AppHistoryEntry on push-like navigations", async () => {
      const appHistory = new AppHistory();
      const firstEntry = appHistory.current;

      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      const navigationPromise = appHistory.navigate("/newUrl");

      expect(appHistory.transition.from).toBe(firstEntry);

      await navigationPromise;
    });

    it("should correctly set the AppHistoryEntry on replace-like navigations", async () => {
      const appHistory = new AppHistory();
      const firstEntry = appHistory.current;

      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      const navigationPromise = appHistory.navigate({
        replace: true,
        state: {},
      });

      expect(appHistory.transition.from).toBe(firstEntry);

      await navigationPromise;
    });

    it("should correctly set the AppHistoryEntry in goTo()", async () => {
      const appHistory = new AppHistory();
      const firstKey = appHistory.current.key;

      await appHistory.navigate("/newUrl");
      const expectedFrom = appHistory.current;

      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      const navigationPromise = appHistory.goTo(firstKey);

      expect(appHistory.transition.from).toBe(expectedFrom);

      await navigationPromise;
    });

    it("should correctly set the AppHistoryEntry in forward()", async () => {
      const appHistory = new AppHistory();
      const expectedFrom = appHistory.current;

      await appHistory.navigate("/newUrl");
      await appHistory.back();

      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      const navigationPromise = appHistory.forward();

      expect(appHistory.transition.from).toBe(expectedFrom);

      await navigationPromise;
    });

    it("should correctly set the AppHistoryEntry in back()", async () => {
      const appHistory = new AppHistory();

      await appHistory.navigate("/newUrl");
      const expectedFrom = appHistory.current;

      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      const navigationPromise = appHistory.back();

      expect(appHistory.transition.from).toBe(expectedFrom);

      await navigationPromise;
    });
  });

  describe("transition finish", () => {
    it("should complete when the transition is done", async () => {
      const appHistory = new AppHistory();
      appHistory.addEventListener("navigate", (evt) => {
        evt.respondWith(new Promise((resolve) => setTimeout(resolve, 10)));
      });

      appHistory.navigate("/newUrl");
      return appHistory.transition.finished;
    });
  });
});

describe("events order", () => {
  it("should fire the events in order for successful navigate()", async () => {
    // https://github.com/WICG/app-history#complete-event-sequence
    const eventsList = [];

    const appHistory = new AppHistory();

    // add an entry that will be disposed of later
    await appHistory.navigate();

    // can you add a navigateto listener to an new entry that you just pushed?
    // appHistory.current.addEventListener("navigateto", () => {
    //   eventsList.push("entry.navigateto");
    // });

    appHistory.current.addEventListener("dispose", () => {
      eventsList.push("entry.dispose");
    });

    await appHistory.back();

    appHistory.current.addEventListener("navigatefrom", () => {
      eventsList.push("entry.navigatefrom");
    });

    appHistory.addEventListener("navigate", (evt) => {
      eventsList.push("navigate");
      evt.respondWith(
        new Promise((resolve) => {
          setTimeout(resolve, 10);
        })
      );
    });

    appHistory.addEventListener("currentchange", () => {
      eventsList.push("currentchange");
    });

    appHistory.addEventListener("navigatesuccess", () => {
      eventsList.push("navigatesuccess");
    });

    // don't await here so we can add the finish listener to the new entry; we await the promise later
    const pushPromise = appHistory.navigate();

    appHistory.current.addEventListener("finish", () => {
      eventsList.push("entry.finish");
    });

    pushPromise.then(() => {
      eventsList.push("promise from navigate()");
    });

    await appHistory.transition.finished.then(() => {
      eventsList.push("transition.finished");
    });

    expect(eventsList).toEqual([
      "navigate",
      "entry.navigatefrom",
      "currentchange",
      // "entry.navigateto", // can you add a navigateto listener to an new entry that you just pushed?
      "entry.dispose",
      "entry.finish",
      "navigatesuccess",
      "promise from navigate()",
      "transition.finished",
    ]);
  });

  it("should fire the events in order for unsuccessful navigate()", async () => {
    // https://github.com/WICG/app-history#complete-event-sequence
    const eventsList = [];

    const appHistory = new AppHistory();

    // add an entry that will be disposed of later
    await appHistory.navigate();

    // can you add a navigateto listener to an new entry that you just pushed?
    // appHistory.current.addEventListener("navigateto", () => {
    //   eventsList.push("entry.navigateto");
    // });

    appHistory.current.addEventListener("dispose", () => {
      eventsList.push("entry.dispose");
    });

    await appHistory.back();

    appHistory.current.addEventListener("navigatefrom", () => {
      eventsList.push("entry.navigatefrom");
    });

    appHistory.addEventListener("navigate", (evt) => {
      eventsList.push("navigate");
      evt.respondWith(
        new Promise((_, reject) => {
          setTimeout(reject, 10);
        })
      );
    });

    appHistory.addEventListener("currentchange", () => {
      eventsList.push("currentchange");
    });

    appHistory.addEventListener("navigateerror", () => {
      eventsList.push("navigateerror");
    });

    // don't await here so we can add the finish listener to the new entry; we await the promise later
    appHistory.navigate().catch(() => {
      eventsList.push("promise from navigate()");
    });

    appHistory.current.addEventListener("finish", () => {
      eventsList.push("entry.finish");
    });

    await appHistory.transition.finished.catch(() => {
      eventsList.push("transition.finished");
    });

    expect(eventsList).toEqual([
      "navigate",
      "entry.navigatefrom",
      "currentchange",
      // "entry.navigateto", // can you add a navigateto listener to an new entry that you just pushed?
      "entry.dispose",
      "entry.finish",
      "navigateerror",
      "promise from navigate()",
      "transition.finished",
    ]);
  });

  it("should fire the events in order for successful replace-like navigation()", async () => {
    // https://github.com/WICG/app-history#complete-event-sequence
    const eventsList = [];

    const appHistory = new AppHistory();

    // can you add a navigateto listener to an new entry that you just pushed?
    // appHistory.current.addEventListener("navigateto", () => {
    //   eventsList.push("entry.navigateto");
    // });

    // appHistory.current.addEventListener("navigatefrom", () => {
    //   eventsList.push("entry.navigatefrom");
    // });

    appHistory.addEventListener("navigate", (evt) => {
      eventsList.push("navigate");
      evt.respondWith(
        new Promise((respond) => {
          setTimeout(respond, 10);
        })
      );
    });

    appHistory.addEventListener("currentchange", () => {
      eventsList.push("currentchange");
    });

    appHistory.addEventListener("navigatesuccess", () => {
      eventsList.push("navigatesuccess");
    });

    // don't await here so we can add the finish listener to the new entry; we await the promise later
    const updatePromise = appHistory.navigate({
      state: "newState",
      replace: true,
    });

    appHistory.current.addEventListener("finish", () => {
      eventsList.push("entry.finish");
    });

    updatePromise.then(() => {
      eventsList.push("promise from navigate()");
    });

    await appHistory.transition.finished.then(() => {
      eventsList.push("transition.finished");
    });

    expect(eventsList).toEqual([
      "navigate",
      // "entry.navigatefrom", // navigate() with replace doesn't cause this to fire, I don't believe
      "currentchange",
      // "entry.navigateto", // can you add a navigateto listener to an new entry that you just pushed?
      // "entry.dispose", // nothing is disposed when you call navigate() with replace
      "entry.finish",
      "navigatesuccess",
      "promise from navigate()",
      "transition.finished",
    ]);
  });

  it("should fire the events in order for unsuccessful replace-like navigation()", async () => {
    // https://github.com/WICG/app-history#complete-event-sequence
    const eventsList = [];

    const appHistory = new AppHistory();

    // can you add a navigateto listener to an new entry that you just pushed?
    // appHistory.current.addEventListener("navigateto", () => {
    //   eventsList.push("entry.navigateto");
    // });

    // appHistory.current.addEventListener("navigatefrom", () => {
    //   eventsList.push("entry.navigatefrom");
    // });

    appHistory.addEventListener("navigate", (evt) => {
      eventsList.push("navigate");
      evt.respondWith(
        new Promise((_, reject) => {
          setTimeout(reject, 10);
        })
      );
    });

    appHistory.addEventListener("currentchange", () => {
      eventsList.push("currentchange");
    });

    appHistory.addEventListener("navigateerror", () => {
      eventsList.push("navigateerror");
    });

    // don't await here so we can add the finish listener to the new entry; we await the promise later
    appHistory
      .navigate({
        state: "newState",
        replace: true,
      })
      .catch(() => {
        eventsList.push("promise from navigate()");
      });

    appHistory.current.addEventListener("finish", () => {
      eventsList.push("entry.finish");
    });

    await appHistory.transition.finished.catch(() => {
      eventsList.push("transition.finished");
    });

    expect(eventsList).toEqual([
      "navigate",
      // "entry.navigatefrom", // update() doesn't cause this to fire, I don't believe
      "currentchange",
      // "entry.navigateto", // can you add a navigateto listener to an new entry that you just pushed?
      // "entry.dispose", // nothing is disposed when you call update()
      "entry.finish",
      "navigateerror",
      "promise from navigate()",
      "transition.finished",
    ]);
  });
});

class MockLocation {
  // thanks to https://github.com/Shopify/quilt/blob/main/packages/jest-dom-mocks/src/location.ts
  static mock() {
    if (this.locationSpy) {
      throw new Error(
        "You tried to mock window.location when it was already mocked."
      );
    }

    this.locationSpy = jest.spyOn(window, "location", "get");
    this.locationSpy.mockReturnValue({
      ...window.location,
      assign: jest.fn((..._args) => {}),
      reload: jest.fn(() => {}),
      replace: jest.fn((..._args) => {}),
    });

    return this.locationSpy;
  }

  static restore() {
    if (!this.locationSpy) {
      throw new Error(
        "You tried to restore window.location when it was already restored."
      );
    }

    this.locationSpy.mockRestore();
    this.locationSpy = null;
  }

  static isMocked() {
    return Boolean(this.locationSpy);
  }
}
