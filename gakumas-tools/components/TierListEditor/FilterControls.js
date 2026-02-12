"use client";
import { memo } from "react";
import { useTranslations } from "next-intl";
import Checkbox from "@/components/Checkbox";
import styles from "./FilterControls.module.scss";

function FilterControls({ entityType, filters, onFiltersChange }) {
  const t = useTranslations("TierList");

  const handleFilterChange = (filterType, value, checked) => {
    const currentValues = filters[filterType] || [];
    
    let newValues;
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    onFiltersChange({
      ...filters,
      [filterType]: newValues
    });
  };

  const handleUpgradedChange = (value) => {
    onFiltersChange({
      ...filters,
      upgraded: value
    });
  };

  const renderPlanFilters = () => {
    const plans = ["sense", "logic"];
    
    return (
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>{t("allPlans")}</label>
        <div className={styles.filterOptions}>
          {plans.map(plan => (
            <Checkbox
              key={plan}
              label={plan}
              checked={(filters.plans || []).includes(plan)}
              onChange={(checked) => handleFilterChange("plans", plan, checked)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderRarityFilters = () => {
    const rarities = ["N", "R", "SR", "SSR"];
    
    return (
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>{t("allRarities")}</label>
        <div className={styles.filterOptions}>
          {rarities.map(rarity => (
            <Checkbox
              key={rarity}
              label={rarity}
              checked={(filters.rarities || []).includes(rarity)}
              onChange={(checked) => handleFilterChange("rarities", rarity, checked)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderSkillCardFilters = () => (
    <>
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>{t("allSourceTypes")}</label>
        <div className={styles.filterOptions}>
          {["produce", "pIdol"].map(sourceType => (
            <Checkbox
              key={sourceType}
              label={sourceType}
              checked={(filters.sourceTypes || []).includes(sourceType)}
              onChange={(checked) => handleFilterChange("sourceTypes", sourceType, checked)}
            />
          ))}
        </div>
      </div>
      
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>{t("upgraded")}</label>
        <div className={styles.radioOptions}>
          <label>
            <input
              type="radio"
              name="upgraded"
              checked={filters.upgraded === null}
              onChange={() => handleUpgradedChange(null)}
            />
            {t("both")}
          </label>
          <label>
            <input
              type="radio"
              name="upgraded"
              checked={filters.upgraded === true}
              onChange={() => handleUpgradedChange(true)}
            />
            {t("upgraded")}
          </label>
          <label>
            <input
              type="radio"
              name="upgraded"
              checked={filters.upgraded === false}
              onChange={() => handleUpgradedChange(false)}
            />
            {t("notUpgraded")}
          </label>
        </div>
      </div>
    </>
  );

  const renderPItemFilters = () => (
    <div className={styles.filterGroup}>
      <label className={styles.filterLabel}>{t("allModes")}</label>
      <div className={styles.filterOptions}>
        {["produce", "contest"].map(mode => (
          <Checkbox
            key={mode}
            label={mode}
            checked={(filters.modes || []).includes(mode)}
            onChange={(checked) => handleFilterChange("modes", mode, checked)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.filterControls}>
      <h3 className={styles.filtersTitle}>{t("filters")}</h3>
      
      {renderPlanFilters()}
      {renderRarityFilters()}
      
      {entityType === "skillCard" && renderSkillCardFilters()}
      {entityType === "pItem" && renderPItemFilters()}
    </div>
  );
}

export default memo(FilterControls);