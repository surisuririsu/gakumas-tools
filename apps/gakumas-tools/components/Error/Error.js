import Image from "@/components/Image";
import styles from "./Error.module.scss";

export default function Error({ code }) {
  return (
    <div className={styles.error}>
      <h2>{code == 404 ? "404 Not Found" : "Error"}</h2>
      <div className={styles.wrapper}>
        <Image
          src={code == 404 ? "/errors/not_found.jpg" : "/errors/generic.jpg"}
          fill
        />
      </div>
    </div>
  );
}
