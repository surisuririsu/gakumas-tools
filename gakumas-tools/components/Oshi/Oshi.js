"use client";
import { useState } from "react";
import { Resizable } from "re-resizable";
import AsobiVideo from "@/components/AsobiVideo";
import YouTubeVideo from "@/components/YouTubeVideo";
import styles from "./Oshi.module.scss";

export default function Oshi({ text, initiallyExpanded, videoId, type, url }) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  if (url) {
    return (
      <div className={styles.oshi}>
        <a
          className={styles.expand}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {text}
        </a>
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
              {type == "asobiChannel" ? (
                <AsobiVideo videoId={videoId} />
              ) : (
                <YouTubeVideo videoId={videoId} />
              )}
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
