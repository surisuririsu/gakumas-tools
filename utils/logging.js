export function logEvent(event, data) {
  try {
    gtag("event", event, data);
  } catch {
    // do nothing
  }
}
