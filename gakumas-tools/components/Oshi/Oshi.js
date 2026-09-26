"use client";
import { useState } from "react";
import { Resizable } from "re-resizable";
import IdolIcon from "@/components/IdolIcon";
import YouTubeVideo from "@/components/YouTubeVideo";
import { oshiBackground, oshiInk, parseOshiText } from "@/utils/oshi";
import styles from "./Oshi.module.scss";

export default function Oshi({
  text,
  colors,
  initiallyExpanded,
  hasBadge,
  videoId,
  url,
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const style = {
    "--oshi-bg": oshiBackground(colors),
    "--oshi-ink": oshiInk(colors),
  };
  const badge = hasBadge && <div className={styles.badge} />;
  const label = (
    <span>
      {parseOshiText(text).map((segment, i) =>
        segment.idolId ? <IdolIcon key={i} idolId={segment.idolId} /> : segment
      )}
    </span>
  );

  if (videoId) {
    return (
      <div className={styles.oshi} style={style}>
        {expanded ? (
          <>
            <Resizable
              className={styles.wrapper}
              defaultSize={{ width: "100%", height: "300px" }}
              handleClasses={{ bottom: styles.handle }}
              enable={{ bottom: true }}
            >
              <YouTubeVideo videoId={videoId} />
            </Resizable>
            <button className={styles.close} onClick={() => setExpanded(false)}>
              ×
            </button>
          </>
        ) : (
          <button className={styles.expand} onClick={() => setExpanded(true)}>
            {badge}
            {label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.oshi} style={style}>
      {expanded ? (
        <a
          className={styles.expand}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setExpanded(false)}
        >
          {label}
        </a>
      ) : (
        <button className={styles.expand} onClick={() => setExpanded(true)}>
          {badge}{" "}
        </button>
      )}
    </div>
  );
}
