import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import useBeat from "./useBeat";
import styles from "./ProduceRankResult.module.scss";

const COUNT_MS = 650;

function useCountUp(value) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    const animate =
      typeof value == "number" &&
      typeof from == "number" &&
      from != value &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    let frame;
    const step = (now) => {
      const progress = Math.min((now - start) / COUNT_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next =
        progress == 1 ? value : Math.round(from + (value - from) * eased);
      shownRef.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return shown;
}

function findNextRank(rating, ratingByRank) {
  if (typeof rating != "number" || !ratingByRank) return null;
  let next = null;
  for (const [rank, threshold] of Object.entries(ratingByRank)) {
    if (threshold <= rating) break;
    next = { rank, points: threshold - rating };
  }
  return next;
}

export default function ProduceRankResult({ rating, rank, ratingByRank }) {
  const t = useTranslations("Calculator");
  const known = rank && rank !== "?";
  const next = rank !== "?" && findNextRank(rating, ratingByRank);
  const counted = useCountUp(rating);
  const shown =
    typeof rating == "number" && typeof counted == "number" ? counted : rating;
  const ratingBeat = useBeat(rating);
  const rankBeat = useBeat(known ? rank : null);

  return (
    <div className={styles.result}>
      <div
        className={c(
          styles.badge,
          !known && styles.unknown,
          rankBeat && styles[`pop${rankBeat}`]
        )}
      >
        {known ? (
          <Image
            src={`/ranks/${rank}.png`}
            alt={rank}
            width={56}
            height={56}
            draggable={false}
          />
        ) : (
          "?"
        )}
      </div>
      <div className={styles.values}>
        <span
          className={c(
            styles.rating,
            typeof rating != "number" && styles.pending,
            ratingBeat && styles[`beat${ratingBeat}`]
          )}
        >
          {shown.toLocaleString()}
        </span>
        <span className={c(styles.next, !next && styles.nextHidden)}>
          {next
            ? t("toNextRank", {
                rank: next.rank,
                points: next.points.toLocaleString(),
              })
            : "-"}
        </span>
      </div>
    </div>
  );
}
