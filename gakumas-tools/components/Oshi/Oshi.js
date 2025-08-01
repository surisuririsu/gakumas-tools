"use client";
import { useState } from "react";
import { Resizable } from "re-resizable";
import styles from "./Oshi.module.scss";

export default function Oshi({ text, initiallyExpanded, videoId, url }) {
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
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
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
