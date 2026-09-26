const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function toJstInput(date) {
  if (!date) return "";
  return new Date(new Date(date).getTime() + JST_OFFSET_MS)
    .toISOString()
    .slice(0, 16);
}

export function fromJstInput(value) {
  return value ? `${value}:00+09:00` : null;
}

export function currentJstHour() {
  return `${toJstInput(Date.now()).slice(0, 13)}:00`;
}

export function weekAfter(value) {
  return toJstInput(new Date(fromJstInput(value)).getTime() + WEEK_MS);
}
