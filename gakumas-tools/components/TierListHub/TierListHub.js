"use client";
import { memo, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import TierListCard from "./TierListCard";
import styles from "./TierListHub.module.scss";

function TierListHub() {
  const { data: session, status } = useSession();
  const t = useTranslations("TierList");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("community");
  const [communityTierLists, setCommunityTierLists] = useState([]);
  const [myTierLists, setMyTierLists] = useState([]);
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (activeTab === "community") {
      loadCommunityTierLists(true);
    } else if (activeTab === "mine" && session) {
      loadMyTierLists();
    }
  }, [activeTab, entityTypeFilter, session]);

  const loadCommunityTierLists = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    
    try {
      const currentPage = reset ? 1 : page;
      const params = new URLSearchParams({ 
        page: currentPage.toString(),
        limit: "20"
      });
      if (entityTypeFilter) {
        params.set("entityType", entityTypeFilter);
      }

      const response = await fetch(`/api/tier-list/list?${params}`);
      const data = await response.json();

      if (reset) {
        setCommunityTierLists(data.tierLists);
        setPage(1);
      } else {
        setCommunityTierLists(prev => [...prev, ...data.tierLists]);
      }
      
      setHasMore(currentPage < data.totalPages);
      setPage(currentPage + 1);
    } catch (error) {
      console.error("Error loading tier lists:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyTierLists = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const response = await fetch("/api/tier-list/mine");
      if (response.ok) {
        const data = await response.json();
        setMyTierLists(data.tierLists);
      }
    } catch (error) {
      console.error("Error loading my tier lists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    if (tab === "mine" && !session) {
      return; // Don't allow switching to mine if not logged in
    }
    setActiveTab(tab);
    setPage(1);
    setHasMore(true);
  };

  const handleEntityTypeFilterChange = (entityType) => {
    setEntityTypeFilter(entityType);
    setPage(1);
    setHasMore(true);
  };

  const handleCreateNew = () => {
    if (!session) {
      alert(t("loginToCreate"));
      return;
    }
    router.push("/tier-list/create");
  };

  const handleTierListDelete = (deletedId) => {
    setMyTierLists(prev => prev.filter(tl => tl._id !== deletedId));
  };

  const renderEntityTypeFilter = () => (
    <div className={styles.filters}>
      <button
        className={`${styles.filterButton} ${!entityTypeFilter ? styles.active : ""}`}
        onClick={() => handleEntityTypeFilterChange("")}
      >
        {t("browse")}
      </button>
      <button
        className={`${styles.filterButton} ${entityTypeFilter === "pIdol" ? styles.active : ""}`}
        onClick={() => handleEntityTypeFilterChange("pIdol")}
      >
        {t("pIdol")}
      </button>
      <button
        className={`${styles.filterButton} ${entityTypeFilter === "skillCard" ? styles.active : ""}`}
        onClick={() => handleEntityTypeFilterChange("skillCard")}
      >
        {t("skillCard")}
      </button>
      <button
        className={`${styles.filterButton} ${entityTypeFilter === "pItem" ? styles.active : ""}`}
        onClick={() => handleEntityTypeFilterChange("pItem")}
      >
        {t("pItem")}
      </button>
    </div>
  );

  const renderTierLists = () => {
    const tierLists = activeTab === "community" ? communityTierLists : myTierLists;
    
    if (loading && tierLists.length === 0) {
      return <div className={styles.loading}>{t("loading")}</div>;
    }

    if (tierLists.length === 0) {
      return (
        <div className={styles.empty}>
          <p>{t("noTierLists")}</p>
          {activeTab === "mine" && session && (
            <Button onClick={handleCreateNew} style={{ marginTop: "1rem" }}>
              {t("createNew")}
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        <div className={styles.tierListGrid}>
          {tierLists.map(tierList => (
            <TierListCard
              key={tierList._id}
              tierList={tierList}
              showActions={activeTab === "mine"}
              onDelete={handleTierListDelete}
            />
          ))}
        </div>
        {activeTab === "community" && hasMore && (
          <div className={styles.loadMore}>
            <Button onClick={() => loadCommunityTierLists(false)} loading={loading}>
              {loading ? t("loading") : "Load More"}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.tierListHub}>
      <header className={styles.header}>
        <h1>{t("title")}</h1>
        <div className={styles.headerActions}>
          <Button onClick={handleCreateNew} disabled={!session}>
            {t("createNew")}
          </Button>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "community" ? styles.active : ""}`}
          onClick={() => handleTabChange("community")}
        >
          {t("community")}
        </button>
        {session && (
          <button
            className={`${styles.tab} ${activeTab === "mine" ? styles.active : ""}`}
            onClick={() => handleTabChange("mine")}
          >
            {t("myTierLists")}
          </button>
        )}
      </div>

      {activeTab === "community" && renderEntityTypeFilter()}

      <div className={styles.content}>
        {renderTierLists()}
      </div>

      {!session && (
        <div className={styles.loginPrompt}>
          <p>{t("loginToCreate")}</p>
        </div>
      )}
    </div>
  );
}

export default memo(TierListHub);