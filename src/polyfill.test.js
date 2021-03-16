import { useBrowserPolyfill } from "./polyfill";

// change these tests to use playwright?
describe("useBrowserPolyfill", () => {
  afterEach(() => {
    delete window.appHistory;
  });
  it("should not do anything if appHistory is already on window", () => {
    const fakeAppHistory = {};
    window.appHistory = fakeAppHistory;
    useBrowserPolyfill({ configurable: true });
    expect(window.appHistory).toBe(fakeAppHistory);
  });

  it("should fire push on 'anchor' clicks", async (done) => {
    useBrowserPolyfill({ configurable: true });

    window.appHistory.addEventListener("navigate", (evt) => {
      expect(evt.destination.url).toBe("http://localhost/page");
      done();
    });

    document.body.innerHTML = `<div><a href="/page">Page</a></div>`;

    document.querySelector("a").click();
  });

  it("should fire push on 'anchor' clicks, even if the target isn't an anchor", async (done) => {
    useBrowserPolyfill({ configurable: true });

    window.appHistory.addEventListener("navigate", (evt) => {
      expect(evt.destination.url).toBe("http://localhost/page");
      done();
    });

    document.body.innerHTML = `<div><a href="/page"><span>Page<span></a></div>`;

    document.querySelector("span").click();
  });

  it("should not fire push on normal clicks", async () => {
    useBrowserPolyfill({ configurable: true });

    const eventListener = jest.fn();
    window.appHistory.addEventListener("navigate", eventListener);

    document.body.innerHTML = `<div><a href="/page">Page</a><button>Button!</button></div>`;

    document.querySelector("button").click();

    await Promise.resolve();

    expect(eventListener).not.toBeCalled();
  });

  it("should not error out if no param passed", () => {
    useBrowserPolyfill();
  });
});
