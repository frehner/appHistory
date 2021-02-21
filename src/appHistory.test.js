import { AppHistory } from "./appHistory";

describe("constructor", () => {
  it("should initialize with a current and entries", () => {
    const appHistory = new AppHistory();

    expect(appHistory.current).not.toBeUndefined();
    expect(appHistory.current).not.toBeNull();
    expect(appHistory.entries.length).toBe(1);
    expect(appHistory.entries[0]).toEqual(appHistory.current);
  });
});

describe("update", () => {
  it("only url: updates url but not the state", () => {
    const appHistory = new AppHistory();
    appHistory.update({ state: "test" });

    const { url: oldUrl, state: oldState } = appHistory.current;

    const updatedUrl = "/newUrl";
    appHistory.update({ url: updatedUrl });

    const { url: newUrl, state: newState } = appHistory.current;

    expect(oldUrl).not.toEqual(newUrl);
    expect(oldState).toEqual(newState);
    expect(newUrl).toEqual(updatedUrl);
  });

  it("only state: updates state but not the url", () => {
    const appHistory = new AppHistory();

    const { url: oldUrl, state: oldState } = appHistory.current;

    const updatedState = "newState";
    appHistory.update({ state: updatedState });

    const { url: newUrl, state: newState } = appHistory.current;

    expect(oldUrl).toEqual(newUrl);
    expect(oldState).not.toEqual(newState);
    expect(newState).toEqual(updatedState);
  });

  it("can null out the state", () => {
    const appHistory = new AppHistory();
    appHistory.update({ state: "before" });

    const { state: oldState } = appHistory.current;

    const updatedState = null;
    appHistory.update({ state: updatedState });

    const { state: newState } = appHistory.current;

    expect(oldState).not.toEqual(newState);
    expect(newState).toEqual(updatedState);
  });

  it("can update both state and url at the same time", () => {
    const appHistory = new AppHistory();

    const { url: oldUrl, state: oldState } = appHistory.current;

    const updatedState = "newState";
    const updatedUrl = "/newUrl";
    appHistory.update({ state: updatedState, url: updatedUrl });

    const { url: newUrl, state: newState } = appHistory.current;

    expect(oldUrl).not.toEqual(newUrl);
    expect(oldState).not.toEqual(newState);

    expect(newUrl).toEqual(updatedUrl);
    expect(newState).toEqual(updatedState);
  });

  it("does not add a new entry to the entries list", () => {
    const appHistory = new AppHistory();

    const oldEntries = appHistory.entries;

    const newState = "newState";
    appHistory.update({ state: newState });

    const newEntries = appHistory.entries;

    expect(oldEntries).not.toEqual(newEntries);
    expect(oldEntries.length).toEqual(newEntries.length);
    expect(newEntries.length).toEqual(1);
    expect(newEntries[0].state).toEqual(newState);
  });
});

describe("push", () => {
  it("no options: adds an entry with the same url but null-ed out state", async () => {
    const appHistory = new AppHistory();
    appHistory.update({ state: "test" });
    const oldEntry = appHistory.current;

    await appHistory.push();

    expect(appHistory.current.state).toBeNull();
    expect(appHistory.current.state).not.toEqual(oldEntry.state);
    expect(appHistory.entries.length).toBe(2);
  });

  it("only state: should overwrite the state and copy the previous URL", async () => {
    const appHistory = new AppHistory();
    const oldEntry = appHistory.current;

    const newState = "newState";
    await appHistory.push({ state: newState });

    expect(appHistory.current.state).toEqual(newState);
    expect(appHistory.current.state).not.toEqual(oldEntry.state);
    expect(appHistory.current.url).toEqual(oldEntry.url);
    expect(appHistory.entries.length).toBe(2);
  });

  it("only url: should set a new url and null out the state", async () => {
    const appHistory = new AppHistory();
    appHistory.update({ state: "test" });
    const oldEntry = appHistory.current;

    const newUrl = "newUrl";
    await appHistory.push({ url: newUrl });

    expect(appHistory.current.url).toEqual(newUrl);
    expect(appHistory.current.url).not.toEqual(oldEntry.url);
    expect(appHistory.current.state).not.toEqual(oldEntry.state);
    expect(appHistory.current.state).toBeNull();
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
    expect(appHistory.current.state).toEqual(newState);
    expect(appHistory.current.state).not.toEqual(oldEntry.state);
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
});

describe("addEventListener", () => {
  describe("navigate", () => {
    it("should add an event listener", async () => {
      const appHistory = new AppHistory();
      let navigateCalled = false;
      appHistory.addEventListener("navigate", () => {
        navigateCalled = true;
      });

      await appHistory.push();

      expect(navigateCalled).toBe(true);
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
});

describe("navigateTo", () => {
  it("should throw an exception if the key is no longer in the entries list", async () => {
    const appHistory = new AppHistory();

    await expect(appHistory.navigateTo("non-existent-key")).rejects.toThrow(
      DOMException
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
});

describe("back", () => {
  it("should throw an exception if it cannot go back further", async () => {
    const appHistory = new AppHistory();

    await expect(appHistory.back()).rejects.toThrow(DOMException);
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
});

describe("forward", () => {
  it("should throw an exception if it cannot go forward because it's the last one", async () => {
    const appHistory = new AppHistory();

    await expect(appHistory.forward()).rejects.toThrow(DOMException);
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
});
