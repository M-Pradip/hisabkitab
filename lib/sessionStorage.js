const VIEWER_KEY_PREFIX = "hk:viewer:";

export function clearSessionViewerState(sessionId) {
  if (typeof window === "undefined") {
    return;
  }

  if (sessionId) {
    window.localStorage.removeItem(`${VIEWER_KEY_PREFIX}${sessionId}`);
    return;
  }

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);

    if (key?.startsWith(VIEWER_KEY_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  }
}
