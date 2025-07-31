"use client";
import styles from "./Hero.module.scss";

export default function Hero() {
  return (
    <div className={styles.hero}>
      <iframe
        width="560"
        height="315"
        src="https://www.youtube.com/embed/CD93hMXh6Yc?autoplay=1"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    </div>
  );
}
