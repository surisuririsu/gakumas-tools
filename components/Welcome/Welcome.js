import { memo } from "react";
import Button from "@/components/Button";
import { TOOLS } from "@/utils/tools";
import styles from "./Welcome.module.scss";

function Welcome() {
  return (
    <div className={styles.welcome}>
      <div className={styles.content}>
        <h2>Gakumas Tools</h2>
        <p>
          プロデュース評価の必要最終試験スコア計算、 メモリーの生成確率計算、
          コンテスト編成のシミュレーションなど便利な機能が揃っています。
        </p>

        <ul>
          {Object.values(TOOLS).map(({ title, icon, description, path }) => {
            return (
              <li key={path} className={styles.feature}>
                <Button ariaLabel={title} href={path}>
                  <span>{icon}</span>
                </Button>
                {description}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default memo(Welcome);
