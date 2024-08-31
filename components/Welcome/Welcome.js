import { memo } from "react";
import Button from "@/components/Button";
import { TOOLS } from "@/utils/tools";
import styles from "./Welcome.module.scss";

function Welcome() {
  return (
    <div className={styles.welcome}>
      <div className={styles.content}>
        <h2>Gakumas Toolsへようこそ！</h2>
        <p>
          プロデュース評価の必要最終試験スコア計算、 メモリーの生成確率計算、
          コンテスト編成のシミュレーションなど便利機能が揃っています。
        </p>

        <h3>機能一覧</h3>
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
