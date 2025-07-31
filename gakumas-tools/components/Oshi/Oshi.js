"use client";
import { useState } from "react";
import styles from "./Oshi.module.scss";

export default function Oshi({ text, initiallyExpanded, videoId }) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  return (
    <div className={styles.oshi}>
      {expanded ? (
        <>
          <div className={styles.wrapper}>
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
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
