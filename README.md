# appHistory polyfill

![Tests](https://github.com/frehner/appHistory/workflows/Tests/badge.svg)

⚠️ Not for production. Use at your own risk; there will be breaking changes because the spec is not yet finalized ⚠️

A polyfill for the [appHistory proposal](https://github.com/WICG/app-history).

## Differences

There are some important differences between the spec and this library:

- This library uses a `CustomEvent` instead of a normal event for event handlers. That means that you'll have to look at `event.detail` for things like `event.detail.respondWith()` or `event.detail.destination` or `event.detail.target` (which is the AppHistoryEntry that fired the event, such as `dispose`)
