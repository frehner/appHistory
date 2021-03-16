# appHistory polyfill

![Tests](https://github.com/frehner/appHistory/workflows/Tests/badge.svg)

⚠️ Not for production. Use at your own risk; there will be breaking changes because the spec is not yet finalized ⚠️

A work-in-progress polyfill for the [appHistory proposal](https://github.com/WICG/app-history).

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

- The events for an `AppHistoryEntry` use `event.detail.target` instead of `event.target` to get access to the AppHistoryEntry that fired the event.
