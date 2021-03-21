import { useBrowserPolyfill } from "./polyfill";

beforeEach(() => {
  document.body.innerHTML = "";
  delete window.appHistory;
});

// change these tests to use playwright?
describe("useBrowserPolyfill", () => {
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

    document.body.innerHTML = `<div><a href="/page"><span>Page</span></a></div>`;

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

  it("should prevent default on anchor/area clicks so that navigation doesn't happen", async (done) => {
    useBrowserPolyfill({ configurable: true });
    window.addEventListener(
      "click",
      (evt) => {
        expect(evt.defaultPrevented).toBe(true);
        done();
      },
      { once: true }
    );

    document.body.innerHTML = `<div><a href="/page">Page</a></div>`;

    document.querySelector("a").click();
  });

  it("should abort a previous anchor click if the promise isn't complete yet", async () => {
    useBrowserPolyfill({ configurable: true });

    let firstRespondWith;
    window.appHistory.addEventListener("navigate", (evt) => {
      if (evt.destination.url === "/page1") {
        firstRespondWith = new Promise((resolve) => setTimeout(resolve, 10));
        evt.respondWith(firstRespondWith);
      }
    });

    document.body.innerHTML = `<div><a href="/page1">Page1</a><a href="/page2">Page2</a></div>`;

    [...document.querySelectorAll("a")].forEach((ele) => ele.click());

    await firstRespondWith;

    expect(window.appHistory.entries.length).toBe(3);
    expect(window.appHistory.current.url).toBe("http://localhost/page2");
    expect(window.appHistory.entries[1].url).toBe("http://localhost/page1");
    expect(window.appHistory.entries[1].finished).toBe(false);
  });

  it("should not error out if no param passed", () => {
    useBrowserPolyfill();
  });
});
