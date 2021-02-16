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
});
