import { AppHistory } from "./appHistory";

describe("constructor", () => {
  it("should initialize with a currentEntry and entries", () => {
    const appHistory = new AppHistory();

    expect(appHistory.currentEntry).not.toBeUndefined();
    expect(appHistory.currentEntry).not.toBeNull();
    expect(appHistory.entries.length).toBe(1);
    expect(appHistory.entries[0]).toEqual(appHistory.currentEntry);
  });
});

describe("updateCurrentEntry", () => {
  it("only url: updates url but not the state", () => {
    const appHistory = new AppHistory();
    appHistory.updateCurrentEntry({ state: "test" });

    const { url: oldUrl, state: oldState } = appHistory.currentEntry;

    const updatedUrl = "/newUrl";
    appHistory.updateCurrentEntry({ url: updatedUrl });

    const { url: newUrl, state: newState } = appHistory.currentEntry;

    expect(oldUrl).not.toEqual(newUrl);
    expect(oldState).toEqual(newState);
    expect(newUrl).toEqual(updatedUrl);
  });

  it("only state: updates state but not the url", () => {
    const appHistory = new AppHistory();

    const { url: oldUrl, state: oldState } = appHistory.currentEntry;

    const updatedState = "newState";
    appHistory.updateCurrentEntry({ state: updatedState });

    const { url: newUrl, state: newState } = appHistory.currentEntry;

    expect(oldUrl).toEqual(newUrl);
    expect(oldState).not.toEqual(newState);
    expect(newState).toEqual(updatedState);
  });

  it("can null out the state", () => {
    const appHistory = new AppHistory();
    appHistory.updateCurrentEntry({ state: "before" });

    const { state: oldState } = appHistory.currentEntry;

    const updatedState = null;
    appHistory.updateCurrentEntry({ state: updatedState });

    const { state: newState } = appHistory.currentEntry;

    expect(oldState).not.toEqual(newState);
    expect(newState).toEqual(updatedState);
  });

  it("can update both state and url at the same time", () => {
    const appHistory = new AppHistory();

    const { url: oldUrl, state: oldState } = appHistory.currentEntry;

    const updatedState = "newState";
    const updatedUrl = "/newUrl";
    appHistory.updateCurrentEntry({ state: updatedState, url: updatedUrl });

    const { url: newUrl, state: newState } = appHistory.currentEntry;

    expect(oldUrl).not.toEqual(newUrl);
    expect(oldState).not.toEqual(newState);

    expect(newUrl).toEqual(updatedUrl);
    expect(newState).toEqual(updatedState);
  });

  it("does not add a new entry to the entries list", () => {
    const appHistory = new AppHistory();

    const oldEntries = appHistory.entries;

    const newState = "newState";
    appHistory.updateCurrentEntry({ state: newState });

    const newEntries = appHistory.entries;

    expect(oldEntries).not.toEqual(newEntries);
    expect(oldEntries.length).toEqual(newEntries.length);
    expect(newEntries.length).toEqual(1);
    expect(newEntries[0].state).toEqual(newState);
  });
});

describe("pushNewEntry", () => {
  it("no options: adds an entry with the same url but null-ed out state", async () => {
    const appHistory = new AppHistory();
    appHistory.updateCurrentEntry({ state: "test" });
    const oldEntry = appHistory.currentEntry;

    await appHistory.pushNewEntry();

    expect(appHistory.currentEntry.state).toBeNull();
    expect(appHistory.currentEntry.state).not.toEqual(oldEntry.state);
    expect(appHistory.entries.length).toBe(2);
  });

  it("only state: should overwrite the state and copy the previous URL", async () => {
    const appHistory = new AppHistory();
    const oldEntry = appHistory.currentEntry;

    const newState = "newState";
    await appHistory.pushNewEntry({ state: newState });

    expect(appHistory.currentEntry.state).toEqual(newState);
    expect(appHistory.currentEntry.state).not.toEqual(oldEntry.state);
    expect(appHistory.currentEntry.url).toEqual(oldEntry.url);
    expect(appHistory.entries.length).toBe(2);
  });

  it("only url: should set a new url and null out the state", async () => {
    const appHistory = new AppHistory();
    appHistory.updateCurrentEntry({ state: "test" });
    const oldEntry = appHistory.currentEntry;

    const newUrl = "newUrl";
    await appHistory.pushNewEntry({ url: newUrl });

    expect(appHistory.currentEntry.url).toEqual(newUrl);
    expect(appHistory.currentEntry.url).not.toEqual(oldEntry.url);
    expect(appHistory.currentEntry.state).not.toEqual(oldEntry.state);
    expect(appHistory.currentEntry.state).toBeNull();
    expect(appHistory.entries.length).toBe(2);
  });

  it("updates both state and url", async () => {
    const appHistory = new AppHistory();
    const oldEntry = appHistory.currentEntry;

    const newUrl = "newUrl";
    const newState = "test";
    await appHistory.pushNewEntry({ url: newUrl, state: newState });

    expect(appHistory.currentEntry.url).toEqual(newUrl);
    expect(appHistory.currentEntry.url).not.toEqual(oldEntry.url);
    expect(appHistory.currentEntry.state).toEqual(newState);
    expect(appHistory.currentEntry.state).not.toEqual(oldEntry.state);
    expect(appHistory.entries.length).toBe(2);
  });
});
