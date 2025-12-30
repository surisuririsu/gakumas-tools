"use client";
import { useState } from "react";
import { Resizable } from "re-resizable";
import IdolIcon from "@/components/IdolIcon";
import YouTubeVideo from "@/components/YouTubeVideo";
import styles from "./Oshi.module.scss";

export const OSHI_PROPS = {
  text: (
    <div>
      「MISHIMA LIVE READING PROJECT-Vol.1」
      伊藤舞音さんが出演する1月28日公演②のチケット残りわずか！
      <IdolIcon idolId={6} />
    </div>
  ),
  initiallyExpanded: true,
  url: "https://www.confetti-web.com/events/12918",
};

export default function Oshi({
  text,
  initiallyExpanded,
  hasBadge,
  videoId,
  url,
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  if (url) {
    return (
      <div className={styles.oshi}>
        {expanded ? (
          <a
            className={styles.expand}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setExpanded(false)}
          >
            {text}
          </a>
        ) : (
          <button className={styles.expand} onClick={() => setExpanded(true)}>
            {hasBadge && <div className={styles.badge} />}{" "}
          </button>
        )}
      </div>
    );
  } else if (videoId) {
    return (
      <div className={styles.oshi}>
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
            {text}
          </button>
        )}
      </div>
    );
  }
}
