# AppHistory

## Unreleased

- Changed `respondWith()` to `transitionWhile()`, and `canRespond` to `canTransition`
- Added `appHistoryEntry.id` as outlined in https://github.com/WICG/app-history#keys-and-ids
- Added `appHistory.transition.navigationType` as outlined in https://github.com/WICG/app-history#transitional-time-after-navigation-interception
- Added `appHistory.transition.from` as outlined in https://github.com/WICG/app-history#transitional-time-after-navigation-interception
- Added `appHistory.transition.finished` as outlined in https://github.com/WICG/app-history#transitional-time-after-navigation-interception
- Updated the traversal methods (e.g. `goTo()`) to be more in-line with `navigate()` as far as being able to use `respondWith()` and fire the correct events. There needs to be additional tests added for these methods.
- (internal) Refactored "update" and "push" functions into a single function for `navigate`. This should help keep "push" and "replace" type navigations in sync, as far as getting features at the same time.

## 0.0.6

- `appHistory.push()` is now `appHistory.navigate()`
- `appHistory.update()` is now `appHistory.navigate({replace: true})`
- `appHistory.navigateTo()` is now `appHistory.goTo()`
- add a catch to polyfill's onclick handler so it doesn't crash
- change TS types from any to unknown
- add package exports

## 0.0.5

- add signal to navigate event and fire abort if a new entry is added before the promises given to respondWith() resolve. The promise returned from appHistory.push will reject, and entry.finished will remain false
- fix default url for first entry
- fix on{event} handler signatures
- add test case for ensuring sameDocument is turned into true if respondWith is call, and throws a SecurityError if you can't respond (cross-origin situations)

## 0.0.4

Fixing bugs with useBrowserPolyfill()

## 0.0.1

Initial release.
