import { activeBanner } from "@/utils/oshi";

const DAY_MS = 24 * 60 * 60 * 1000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MIN_DAYS_AHEAD = 7;
const MAX_DAYS_AHEAD = 90;
const MAX_TICKS = 8;
const TICK_STEPS = [1, 2, 7, 14, 28];

function startOfJstDay(time) {
  return Math.floor((time + JST_OFFSET_MS) / DAY_MS) * DAY_MS - JST_OFFSET_MS;
}

function jstParts(time) {
  const date = new Date(time + JST_OFFSET_MS);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    day: `${date.getUTCMonth() + 1}/${date.getUTCDate()}`,
    time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
  };
}

export function formatJstDay(time) {
  return jstParts(time).day;
}

export function formatJst(time) {
  const { day, time: clock } = jstParts(time);
  return `${day} ${clock}`;
}

function scheduleTimes(banners) {
  return banners
    .flatMap(({ startsAt, endsAt }) => [startsAt, endsAt])
    .filter(Boolean)
    .map((date) => date.getTime());
}

export function timelineRange(banners, now) {
  const upcoming = scheduleTimes(banners).filter((time) => time > now);
  const latest = Math.min(
    Math.max(now + MIN_DAYS_AHEAD * DAY_MS, ...upcoming),
    now + MAX_DAYS_AHEAD * DAY_MS
  );
  return {
    start: startOfJstDay(now - DAY_MS),
    end: startOfJstDay(latest) + DAY_MS,
  };
}

export function timelineTicks({ start, end }) {
  const days = (end - start) / DAY_MS;
  const step =
    TICK_STEPS.find((s) => days / s <= MAX_TICKS) ?? TICK_STEPS.at(-1);
  const ticks = [];
  for (let time = start; time < end; time += step * DAY_MS) ticks.push(time);
  return ticks;
}

export function onSiteSegments(banners, { start, end }) {
  const edges = [
    ...new Set([
      start,
      end,
      ...scheduleTimes(banners).filter((time) => time > start && time < end),
    ]),
  ].sort((a, b) => a - b);

  const segments = [];
  for (const [i, from] of edges.slice(0, -1).entries()) {
    const to = edges[i + 1];
    const id = activeBanner(banners, new Date((from + to) / 2))?.id;
    const last = segments.at(-1);
    if (last && last.id == id) {
      last.to = to;
    } else {
      segments.push({ id, from, to });
    }
  }
  return segments.filter(({ id }) => id);
}

export function bannerWindow({ startsAt, endsAt }, { start, end }) {
  const from = Math.max(start, startsAt?.getTime() ?? -Infinity);
  const to = Math.min(end, endsAt?.getTime() ?? Infinity);
  if (to <= from) return null;
  return { from, to, openStart: from == start, openEnd: to == end };
}
