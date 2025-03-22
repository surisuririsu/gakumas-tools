"use client";
import { useContext, useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { FaCircleXmark, FaRegTrashCan } from "react-icons/fa6";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import Input from "@/components/Input";
import LoadoutSummary from "@/components/LoadoutHistory/LoadoutSummary";
import Modal from "@/components/Modal";
import LoadoutContext from "@/contexts/LoadoutContext";
import ModalContext from "@/contexts/ModalContext";
import styles from "./LoadoutManagerModal.module.scss";

export default function LoadoutManagerModal() {
  const t = useTranslations("MemorySave");
  const { status } = useSession();
  const { fetchLoadouts, saveLoadout, deleteLoadouts, loadout, setLoadout } =
    useContext(LoadoutContext);
  const { closeModal } = useContext(ModalContext);
  const [loadouts, setLoadouts] = useState([]);
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [selectedLoadouts, setSelectedLoadouts] = useState({});

  useEffect(() => {
    if (status == "authenticated") fetchLoadouts().then(setLoadouts);
  }, [status, fetchLoadouts]);

  function handleLoad(loadout) {
    setLoadout(loadout);
    closeModal();
  }

  async function handleSave() {
    await saveLoadout(name);
    setLoadouts(await fetchLoadouts());
  }

  async function handleDeleteSelected() {
    const idsToDelete = Object.keys(selectedLoadouts).filter(
      (id) => selectedLoadouts[id]
    );
    await deleteLoadouts(idsToDelete);
    setLoadouts(await fetchLoadouts());
    setSelectedLoadouts({});
    setDeleting(false);
  }

  const Row = ({ index, style }) => {
    const loadout = loadouts[index];
    return (
      <div className={styles.loadoutRow} style={style}>
        {deleting && (
          <div className={styles.check}>
            <input
              type="checkbox"
              checked={!!selectedLoadouts[loadout._id]}
              onChange={(e) =>
                setSelectedLoadouts((prev) => ({
                  ...prev,
                  [loadout._id]: e.target.checked,
                }))
              }
            />
          </div>
        )}
        <Button
          className={styles.loadoutSummary}
          onClick={() => handleLoad(loadout)}
        >
          <div>{loadout.name}</div>
          <div>
            <LoadoutSummary loadout={loadout} />
          </div>
        </Button>
      </div>
    );
  };

  return (
    <Modal>
      <div className={styles.currentLoadout}>
        <LoadoutSummary loadout={loadout} />
        <div className={styles.save}>
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={setName}
          />
          {status == "authenticated" ? (
            <Button style="primary" onClick={handleSave}>
              {t("save")}
            </Button>
          ) : (
            <Button style="primary" onClick={() => signIn("discord")}>
              {t("signInToSave")}
            </Button>
          )}
        </div>
      </div>

      {!!loadouts.length && (
        <>
          <div className={styles.actions}>
            <IconButton
              icon={deleting ? FaCircleXmark : FaRegTrashCan}
              onClick={() => setDeleting((prev) => !prev)}
            />
            {deleting && (
              <Button style="red" onClick={handleDeleteSelected}>
                Delete
              </Button>
            )}
          </div>

          <div className={styles.loadoutList}>
            <AutoSizer>
              {({ width, height }) => (
                <List
                  height={height}
                  itemCount={loadouts.length}
                  itemSize={172}
                  width={width}
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
          </div>
        </>
      )}
    </Modal>
  );
}
