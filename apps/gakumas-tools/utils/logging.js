export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function logEvent(event, data) {
  try {
    gtag("event", event, data);
  } catch {
    // do nothing
  }
}
