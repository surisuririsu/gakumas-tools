import { memo, useContext } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { FaCheck } from "react-icons/fa6";
import Button from "@/components/Button";
import MemoryContext from "@/contexts/MemoryContext";
import styles from "./MemorySave.module.scss";

function MemorySave() {
  const t = useTranslations("MemorySave");

  const { status } = useSession();
  const { id, save, saveState } = useContext(MemoryContext);

  return (
    <div className={styles.save}>
      {status == "unauthenticated" && (
        <Button style="primary" onClick={() => signIn("discord")}>
          {t("signInToSave")}
        </Button>
      )}

      {status == "authenticated" && (
        <>
          <Button
            style="primary"
            onClick={() => save(false)}
            disabled={saveState == "saving"}
          >
            {t("save")}
          </Button>
          {id && (
            <Button
              style="primary"
              onClick={() => save(true)}
              disabled={saveState == "saving"}
            >
              {t("saveAsNew")}
            </Button>
          )}
        </>
      )}

      {saveState == "saved" && <FaCheck />}
    </div>
  );
}

export default memo(MemorySave);
