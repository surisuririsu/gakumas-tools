"use client";
import { memo, useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PIdols, SkillCards, PItems } from "gakumas-data";
import Button from "@/components/Button";
import Input from "@/components/Input";
import EntityIcon from "@/components/EntityIcon";
import TierRow from "./TierRow";
import UnrankedPool from "./UnrankedPool";
import FilterControls from "./FilterControls";
import { EntityTypes } from "@/utils/entities";
import styles from "./TierListEditor.module.scss";

function TierListEditor({ editId }) {
  const { data: session, status } = useSession();
  const t = useTranslations("TierList");
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entityType, setEntityType] = useState("pIdol");
  const [isPublic, setIsPublic] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    plans: [],
    rarities: [],
    sourceTypes: [], // for skillCards
    upgraded: null, // for skillCards: true/false/null
    modes: [], // for pItems
  });
  
  // Tier data
  const [tiers, setTiers] = useState({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    F: []
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Load tier list for editing
  useEffect(() => {
    if (editId && session) {
      loadTierListForEdit();
    }
  }, [editId, session]);

  const loadTierListForEdit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tier-list?id=${editId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load tier list");
      }
      
      const data = await response.json();
      const tierList = data.tierList;
      
      // Check if user owns this tier list
      if (tierList.userId !== session.user.id) {
        throw new Error("Access denied");
      }
      
      setTitle(tierList.title);
      setDescription(tierList.description || "");
      setEntityType(tierList.entityType);
      setIsPublic(tierList.isPublic);
      setFilters(tierList.filters || {});
      setTiers(tierList.tiers);
    } catch (error) {
      console.error("Error loading tier list:", error);
      alert(t("error"));
      router.push("/tier-list");
    } finally {
      setLoading(false);
    }
  };

  // Get all available entities based on current filters
  const availableEntities = useMemo(() => {
    let entities = [];
    
    switch (entityType) {
      case "pIdol":
        entities = PIdols.getAll();
        break;
      case "skillCard":
        entities = SkillCards.getAll();
        break;
      case "pItem":
        entities = PItems.getAll();
        break;
    }
    
    // Apply filters
    if (filters.plans && filters.plans.length > 0) {
      entities = entities.filter(e => filters.plans.includes(e.plan) || e.plan === "free");
    }
    
    if (filters.rarities && filters.rarities.length > 0) {
      entities = entities.filter(e => filters.rarities.includes(e.rarity));
    }
    
    if (entityType === "skillCard") {
      if (filters.sourceTypes && filters.sourceTypes.length > 0) {
        entities = entities.filter(e => filters.sourceTypes.includes(e.sourceType));
      }
      if (filters.upgraded !== null) {
        entities = entities.filter(e => Boolean(e.upgraded) === filters.upgraded);
      }
    }
    
    if (entityType === "pItem" && filters.modes && filters.modes.length > 0) {
      entities = entities.filter(e => 
        filters.modes.some(mode => e.mode === mode || (Array.isArray(e.mode) && e.mode.includes(mode)))
      );
    }
    
    return entities;
  }, [entityType, filters]);

  // Get entities that are not in any tier
  const unrankedEntities = useMemo(() => {
    const rankedIds = new Set();
    Object.values(tiers).forEach(tierEntities => {
      tierEntities.forEach(id => rankedIds.add(id));
    });
    
    return availableEntities.filter(entity => !rankedIds.has(entity.id));
  }, [availableEntities, tiers]);

  const handleEntityMove = (entityId, fromTier, toTier, index) => {
    setTiers(prevTiers => {
      const newTiers = { ...prevTiers };
      
      // Remove from source
      if (fromTier === "unranked") {
        // Entity is coming from unranked pool, no need to remove
      } else {
        newTiers[fromTier] = newTiers[fromTier].filter(id => id !== entityId);
      }
      
      // Add to destination
      if (toTier === "unranked") {
        // Entity is going to unranked pool, no need to add
      } else {
        const tierArray = [...newTiers[toTier]];
        if (index !== undefined) {
          tierArray.splice(index, 0, entityId);
        } else {
          tierArray.push(entityId);
        }
        newTiers[toTier] = tierArray;
      }
      
      return newTiers;
    });
  };

  const handleSave = async () => {
    if (!session) {
      alert(t("loginToCreate"));
      return;
    }

    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    setSaving(true);
    
    try {
      const payload = {
        title,
        description,
        entityType,
        filters,
        tiers,
        isPublic
      };

      let url = "/api/tier-list";
      let method = "POST";
      
      if (editId) {
        payload.id = editId;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const tierListId = editId || data.id;
        router.push(`/tier-list/${tierListId}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || t("error"));
      }
    } catch (error) {
      console.error("Error saving tier list:", error);
      alert(t("error"));
    } finally {
      setSaving(false);
    }
  };

  const getEntityTypeForDnd = () => {
    switch (entityType) {
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

  if (status === "loading" || loading) {
    return (
      <div className={styles.loading}>
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.loginPrompt}>
        <h1>{t("loginToCreate")}</h1>
        <Button onClick={() => router.push("/tier-list")}>
          {t("browse")}
        </Button>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.tierListEditor}>
        <header className={styles.header}>
          <h1>{editId ? t("edit") : t("createNew")}</h1>
        </header>

        <div className={styles.form}>
          <div className={styles.basicInfo}>
            <Input
              label={t("titlePlaceholder")}
              value={title}
              onChange={setTitle}
              placeholder={t("titlePlaceholder")}
              maxLength={100}
              required
            />
            
            <Input
              label={t("descriptionPlaceholder")}
              value={description}
              onChange={setDescription}
              placeholder={t("descriptionPlaceholder")}
              maxLength={500}
              multiline
            />

            <div className={styles.entityTypeSelector}>
              <label>{t("entityType")}</label>
              <div className={styles.entityTypeButtons}>
                {["pIdol", "skillCard", "pItem"].map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`${styles.entityTypeButton} ${entityType === type ? styles.active : ""}`}
                    onClick={() => setEntityType(type)}
                  >
                    {t(type)}
                  </button>
                ))}
              </div>
            </div>

            <FilterControls
              entityType={entityType}
              filters={filters}
              onFiltersChange={setFilters}
            />

            <div className={styles.visibilityControls}>
              <label>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                {t("publicTierList")}
              </label>
            </div>
          </div>

          <div className={styles.tierEditor}>
            <h2>{t("dragHint")}</h2>
            
            <div className={styles.tiers}>
              {["S", "A", "B", "C", "D", "F"].map(tier => (
                <TierRow
                  key={tier}
                  tier={tier}
                  entities={tiers[tier]}
                  entityType={getEntityTypeForDnd()}
                  onEntityMove={handleEntityMove}
                />
              ))}
            </div>

            <div className={styles.unrankedSection}>
              <h3>{t("unranked")}</h3>
              <UnrankedPool
                entities={unrankedEntities}
                entityType={getEntityTypeForDnd()}
                onEntityMove={handleEntityMove}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Button onClick={() => router.push("/tier-list")}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              loading={saving}
              disabled={!title.trim()}
            >
              {editId ? t("save") : t("publish")}
            </Button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default memo(TierListEditor);