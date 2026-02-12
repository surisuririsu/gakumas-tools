"use client";
import { memo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import styles from "./TierListCard.module.scss";

function TierListCard({ tierList, showActions, onDelete }) {
  const t = useTranslations("TierList");
  const router = useRouter();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const handleView = () => {
    router.push(`/tier-list/${tierList._id}`);
  };

  const handleEdit = () => {
    router.push(`/tier-list/create?edit=${tierList._id}`);
  };

  const handleDelete = async () => {
    if (!confirm(t("confirmDelete"))) {
      return;
    }

    try {
      const response = await fetch("/api/tier-list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [tierList._id] }),
      });

      if (response.ok) {
        onDelete?.(tierList._id);
      } else {
        alert(t("error"));
      }
    } catch (error) {
      console.error("Error deleting tier list:", error);
      alert(t("error"));
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/tier-list/${tierList._id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(t("copied"));
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      // Fallback
      prompt(t("share"), url);
    }
  };

  const getTierSummaryText = () => {
    const { tierSummary } = tierList;
    const tiers = ["S", "A", "B", "C", "D", "F"];
    const counts = tiers.map(tier => `${tier}: ${tierSummary[tier] || 0}`);
    return counts.join(" / ");
  };

  return (
    <div className={styles.tierListCard}>
      <div className={styles.header}>
        <h3 className={styles.title}>{tierList.title}</h3>
        <span className={styles.entityType}>{t(tierList.entityType)}</span>
      </div>
      
      {tierList.description && (
        <p className={styles.description}>{tierList.description}</p>
      )}

      <div className={styles.metadata}>
        <div className={styles.author}>
          {t("createdBy", { author: tierList.userName })}
        </div>
        <div className={styles.date}>
          {t("createdAt", { date: formatDate(tierList.createdAt) })}
        </div>
        <div className={styles.tierSummary}>
          {getTierSummaryText()}
        </div>
        <div className={styles.totalEntities}>
          {t("totalEntities", { count: tierList.totalEntities })}
        </div>
        {tierList.isPublic !== undefined && (
          <div className={styles.visibility}>
            {tierList.isPublic ? t("publicTierList") : t("privateTierList")}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button size="small" onClick={handleView}>
          {t("viewTierList")}
        </Button>
        <Button size="small" onClick={handleShare}>
          {t("shareTierList")}
        </Button>
        {showActions && (
          <>
            <Button size="small" onClick={handleEdit}>
              {t("editTierList")}
            </Button>
            <Button size="small" variant="danger" onClick={handleDelete}>
              {t("deleteTierList")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(TierListCard);