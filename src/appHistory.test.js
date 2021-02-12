import { AppHistory } from "./appHistory";

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
    expect(newEntries.length).toEqual(1);
    expect(newEntries[0].state).toEqual(newState);
  });
});
