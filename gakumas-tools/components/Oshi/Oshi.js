"use client";
import { useState } from "react";
import { Resizable } from "re-resizable";
import IdolIcon from "@/components/IdolIcon";
import YouTubeVideo from "@/components/YouTubeVideo";
import styles from "./Oshi.module.scss";

export const OSHI_PROPS = {
  text: (
    <div>
      2月1日
      <IdolIcon idolId={9} />
      『薄井友里の#サシバナ』第3部のゲストに伊藤舞音さん
      <IdolIcon idolId={6} />
      が出演！
      <br />
      チケット先行は1月9日(金)23:59まで！
    </div>
  ),
  initiallyExpanded: true,
  url: "https://ch.nicovideo.jp/voicegarage/blomaga/ar2225847",
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
