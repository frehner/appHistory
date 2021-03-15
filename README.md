# appHistory polyfill

![Tests](https://github.com/frehner/appHistory/workflows/Tests/badge.svg)

⚠️ Not for production. Use at your own risk; there will be breaking changes because the spec is not yet finalized ⚠️

A polyfill for the [appHistory proposal](https://github.com/WICG/app-history).

## Usage

This polyfill must run in a browser-like environment (e.g. an env that has `window.location` and `window.history`). If there's time, and demand for it, I think it would be interesting to have a discussion about how this polyfill could work in other environments.

To setup the polyfill so that it will automatically listen for anchor tag clicks, do the following:

```js
import { useBrowerPolyfill } from "TODO";
userBrowserPolyfill();

// appHistory is now on the window
window.appHistory.push();
```

Alternatively, you can create your own instance of AppHistory:

```js
import { AppHistory } from "TODO";
const appHistory = new AppHistory();

// use your own instance of appHistory, without any events from things like anchor tags
appHistory.push();
```

## Differences

There are some important differences between the spec and this library:

- This library uses a `CustomEvent` instead of a normal event for event handlers. That means that you'll have to look at `event.detail` for things like `event.detail.respondWith()` or `event.detail.destination` or `event.detail.target` (which is the AppHistoryEntry that fired the event, such as `dispose`)
