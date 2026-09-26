import c from "@/utils/classNames";
import { bannerStatus, oshiBackground } from "@/utils/oshi";
import {
  bannerWindow,
  formatJst,
  formatJstDay,
  onSiteSegments,
  timelineRange,
  timelineTicks,
} from "./timeline";
import styles from "./OshiEditor.module.scss";

const STATUS_LABELS = {
  showing: "Showing",
  hidden: "Hidden by a newer banner",
  scheduled: "Scheduled",
  ended: "Ended",
  off: "Off",
};

function scheduleLabel({ startsAt, endsAt }) {
  if (!startsAt && !endsAt) return "Always";
  const from = startsAt ? formatJst(startsAt.getTime()) : "…";
  const to = endsAt ? formatJst(endsAt.getTime()) : "…";
  return `${from} → ${to}`;
}

export default function BannerTimeline({
  banners,
  selectedId,
  errorIndex,
  now,
  onSelect,
}) {
  const range = timelineRange(banners, now);
  const segments = onSiteSegments(banners, range);
  const span = range.end - range.start;
  const at = (time) => (time - range.start) / span;
  const place = (from, to) => ({
    left: `${at(from) * 100}%`,
    width: `${((to - from) / span) * 100}%`,
  });
  const backgrounds = Object.fromEntries(
    banners.map(({ id, colors }) => [id, oshiBackground(colors)])
  );
  const texts = Object.fromEntries(
    banners.map(({ id, text }) => [id, text.ja || "Untitled"])
  );

  function renderSegments(list) {
    return list.map(({ id, from, to }) => (
      <span
        key={`${id}-${from}`}
        className={c(
          styles.bar,
          from == range.start && styles.openStart,
          to == range.end && styles.openEnd
        )}
        style={{ ...place(from, to), background: backgrounds[id] }}
        data-tooltip-id="panel-info-tooltip"
        data-tooltip-content={`${texts[id]} · ${formatJst(from)} → ${formatJst(to)}`}
      />
    ));
  }

  return (
    <>
      <div className={styles.timeline}>
        <div className={styles.grid} aria-hidden="true">
          {timelineTicks(range).map((time) => (
            <span
              key={time}
              className={styles.tick}
              style={{ "--at": at(time) }}
            >
              {formatJstDay(time)}
            </span>
          ))}
          <span className={styles.now} style={{ "--at": at(now) }} />
        </div>

        <div className={styles.lane}>
          <span className={styles.laneTitle}>On site</span>
          <span className={styles.track}>
            {segments.length ? (
              renderSegments(segments)
            ) : (
              <span className={styles.empty}>No banner</span>
            )}
          </span>
        </div>

        {banners.map((banner, i) => {
          const status = bannerStatus(banner, banners, new Date(now));
          const scheduled = bannerWindow(banner, range);
          return (
            <button
              key={banner.id}
              type="button"
              className={c(
                styles.item,
                banner.id == selectedId && styles.selected,
                i == errorIndex && styles.invalid
              )}
              onClick={() => onSelect(banner.id)}
            >
              <span className={styles.itemHeader}>
                <span
                  className={styles.dot}
                  style={{ background: backgrounds[banner.id] }}
                />
                <span className={styles.summary}>
                  <span className={styles.summaryText}>{texts[banner.id]}</span>
                  <span className={styles.summarySchedule}>
                    {scheduleLabel(banner)}
                  </span>
                </span>
                <span className={c(styles.status, styles[status])}>
                  {STATUS_LABELS[status]}
                </span>
              </span>
              <span className={styles.track}>
                {scheduled && (
                  <span
                    className={c(
                      styles.window,
                      !banner.enabled && styles.off,
                      scheduled.openStart && styles.openStart,
                      scheduled.openEnd && styles.openEnd
                    )}
                    style={{
                      ...place(scheduled.from, scheduled.to),
                      background: banner.enabled
                        ? backgrounds[banner.id]
                        : undefined,
                    }}
                  />
                )}
                {renderSegments(segments.filter(({ id }) => id == banner.id))}
              </span>
            </button>
          );
        })}
      </div>
      <span className={styles.caption}>
        Days in JST. The red line is now; faded bars are hidden by a newer
        banner.
      </span>
    </>
  );
}
