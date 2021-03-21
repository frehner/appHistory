# AppHistory

## 0.0.5

- add signal to navigate event and fire abort if a new entry is added before the promises given to respondWith() resolve. The promise returned from appHistory.push will reject, and entry.finished will remain false
- fix default url for first entry
- fix on{event} handler signatures
- add test case for ensuring sameDocument is turned into true if respondWith is call, and throws a SecurityError if you can't respond (cross-origin situations)

## 0.0.4

Fixing bugs with useBrowserPolyfill()

## 0.0.1

Initial release.
