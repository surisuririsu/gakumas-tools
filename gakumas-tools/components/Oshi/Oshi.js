"use client";
import { useState } from "react";
import { Resizable } from "re-resizable";
import IdolIcon from "@/components/IdolIcon";
import YouTubeVideo from "@/components/YouTubeVideo";
import styles from "./Oshi.module.scss";

export const OSHI_PROPS = {
  text: <div><IdolIcon idolId={6} />「伊藤舞音 浅見香月のおかづラジオ FIRST-BITE 2026」通常チケット 一般販売受付中です！</div>,
  initiallyExpanded: true,
  url: "https://nicochannel.jp/okazuradio/articles/news/arZQmcTWYyxkv5NRhrhLCUMB",
}

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
