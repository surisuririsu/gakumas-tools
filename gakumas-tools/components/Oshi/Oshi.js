"use client";
import { useState } from "react";
import { Resizable } from "re-resizable";
import YouTubeVideo from "@/components/YouTubeVideo";
import styles from "./Oshi.module.scss";

const Badge = () => (
  <div
    style={{
      display: "inline-block",
      marginRight: 8,
      backgroundColor: "#ff3333",
      borderRadius: 5,
      width: 10,
      height: 10,
    }}
  />
);

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
            {hasBadge && <Badge />}{" "}
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
