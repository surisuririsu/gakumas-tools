"use client";
import { memo, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import EntityIcon from "@/components/EntityIcon";
import { EntityTypes } from "@/utils/entities";
import styles from "./TierListView.module.scss";

function TierListView({ tierListId }) {
  const { data: session } = useSession();
  const t = useTranslations("TierList");
  const router = useRouter();
  const [tierList, setTierList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTierList();
  }, [tierListId]);

  const loadTierList = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tier-list?id=${tierListId}`);
      if (response.ok) {
        const data = await response.json();
        setTierList(data.tierList);
      } else if (response.status === 404) {
        setError("Tier list not found");
      } else if (response.status === 403) {
        setError("Access denied");
      } else {
        setError("Failed to load tier list");
      }
    } catch (error) {
      console.error("Error loading tier list:", error);
      setError("Failed to load tier list");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const handleEdit = () => {
    router.push(`/tier-list/create?edit=${tierListId}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert(t("copied"));
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      prompt(t("share"), url);
    }
  };

  const getEntityType = () => {
    switch (tierList?.entityType) {
      case "pIdol":
        return EntityTypes.P_IDOL;
      case "skillCard":
        return EntityTypes.SKILL_CARD;
      case "pItem":
        return EntityTypes.P_ITEM;
      default:
        return EntityTypes.P_IDOL;
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      S: "#ff6b6b",
      A: "#ffa500", 
      B: "#ffeb3b",
      C: "#4caf50",
      D: "#2196f3",
      F: "#9e9e9e"
    };
    return colors[tier] || "#9e9e9e";
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (error || !tierList) {
    return (
      <div className={styles.error}>
        <h1>{t("error")}</h1>
        <p>{error || "Tier list not found"}</p>
        <Button onClick={() => router.push("/tier-list")}>
          {t("browse")}
        </Button>
      </div>
    );
  }

  const isOwner = session?.user?.id === tierList.userId;

  return (
    <div className={styles.tierListView}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>{tierList.title}</h1>
          <span className={styles.entityType}>{t(tierList.entityType)}</span>
        </div>
        
        <div className={styles.actions}>
          <Button onClick={handleShare}>
            {t("share")}
          </Button>
          {isOwner && (
            <Button onClick={handleEdit}>
              {t("edit")}
            </Button>
          )}
        </div>
      </header>

      <div className={styles.metadata}>
        <div className={styles.author}>
          {t("createdBy", { author: tierList.userName })}
        </div>
        <div className={styles.date}>
          {t("createdAt", { date: formatDate(tierList.createdAt) })}
          {tierList.updatedAt && tierList.updatedAt !== tierList.createdAt && (
            <span className={styles.updated}>
              {" • " + t("updatedAt", { date: formatDate(tierList.updatedAt) })}
            </span>
          )}
        </div>
        <div className={styles.visibility}>
          {tierList.isPublic ? t("publicTierList") : t("privateTierList")}
        </div>
      </div>

      {tierList.description && (
        <div className={styles.description}>
          <p>{tierList.description}</p>
        </div>
      )}

      <div className={styles.tiers}>
        {["S", "A", "B", "C", "D", "F"].map(tier => {
          const entities = tierList.tiers[tier] || [];
          
          return (
            <div key={tier} className={styles.tierRow}>
              <div 
                className={styles.tierLabel}
                style={{ backgroundColor: getTierColor(tier) }}
              >
                <span>{tier}</span>
                <span className={styles.count}>({entities.length})</span>
              </div>
              <div className={styles.tierEntities}>
                {entities.length > 0 ? (
                  entities.map(entityId => (
                    <div key={entityId} className={styles.entityWrapper}>
                      <EntityIcon
                        type={getEntityType()}
                        id={entityId}
                        size="medium"
                      />
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyTier}>
                    <span>—</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TierListView);