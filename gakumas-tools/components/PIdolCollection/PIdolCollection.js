"use client";
import { memo, useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FaXTwitter } from "react-icons/fa6";
import { Idols, PIdols } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import IconSelect from "@/components/IconSelect";
import { SIGNATURE_CARD_BY_PIDOL } from "@/utils/entities";
import { SITE_URL, localePath } from "@/utils/localeUrls";
import { PLANS } from "@/utils/plans";
import { comparePIdols } from "@/utils/sort";
import usePersistedState from "@/utils/usePersistedState";
import BreakdownGroup from "./BreakdownGroup";
import PIdolTile from "./PIdolTile";
import RaritySelect from "./RaritySelect";
import { pct } from "./utils";
import styles from "./PIdolCollection.module.scss";

const RARITIES = ["R", "SR", "SSR"];

// Excluded idol IDs — these p-idols can't actually be obtained.
// 14 = 根緒 亜紗里 (April Fools idol)
const EXCLUDED_IDOL_IDS = new Set([14]);

const ALL_P_IDOLS = PIdols.getAll()
  .filter((p) => !EXCLUDED_IDOL_IDS.has(p.idolId))
  .sort(comparePIdols);

const ALL_IDOLS = Idols.getAll().filter(
  (idol) => !EXCLUDED_IDOL_IDS.has(idol.id),
);

const planOptions = PLANS.map((alias) => ({
  id: alias,
  iconSrc: `/plans/${alias}.png`,
  alt: alias,
}));

const idolOptions = ALL_IDOLS.map((idol) => ({
  id: idol.id,
  iconSrc: gkImg(idol).icon,
  alt: idol.name,
}));

const BREAKDOWNS = [
  {
    filterKey: "rarity",
    statsKey: "byRarity",
    labelKey: "byRarity",
    iconFor: (row) => ({
      src: `/rarities/${row.value}.png`,
      width: 54,
      height: 18,
      alt: row.value,
    }),
  },
  {
    filterKey: "plan",
    statsKey: "byPlan",
    labelKey: "byPlan",
    iconFor: (row) => ({
      src: `/plans/${row.value}.png`,
      width: 18,
      height: 18,
      alt: row.value,
    }),
  },
  {
    filterKey: "idolId",
    statsKey: "byIdol",
    labelKey: "byIdol",
    iconFor: (row) => ({
      src: gkImg(row.idol).icon,
      width: 18,
      height: 18,
      alt: row.idol.name,
    }),
  },
];

function buildShareScopeKey(filters) {
  const parts = [];
  if (filters.rarity) parts.push("rarity");
  if (filters.plan) parts.push("plan");
  if (filters.idolId) parts.push("idol");
  if (parts.length === 3) return "all";
  if (parts.length === 0) return "none";
  return parts.join("_");
}

function PIdolCollection() {
  const t = useTranslations("PIdolCollection");
  const locale = useLocale();

  const [collected, setCollected] = usePersistedState("pIdolCollection", {});
  const [filters, setFilters] = usePersistedState("pIdolCollectionFilters", {
    rarity: "SSR",
    plan: null,
    idolId: null,
  });

  const toggle = useCallback(
    (id) => {
      setCollected((prev) => {
        const next = { ...prev };
        if (next[id]) delete next[id];
        else next[id] = true;
        return next;
      });
    },
    [setCollected],
  );

  const setFilter = useCallback(
    (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setFilters],
  );

  const filteredPIdols = useMemo(() => {
    return ALL_P_IDOLS.filter((p) => {
      if (filters.rarity && p.rarity !== filters.rarity) return false;
      if (filters.plan && p.plan !== filters.plan) return false;
      if (filters.idolId && p.idolId !== filters.idolId) return false;
      return true;
    });
  }, [filters]);

  const stats = useMemo(() => {
    const total = filteredPIdols.length;
    const have = filteredPIdols.filter((p) => collected[p.id]).length;

    const breakdown = (groupKey, groupValues) =>
      groupValues
        .map((value) => {
          const inGroup = filteredPIdols.filter((p) => p[groupKey] === value);
          return {
            value,
            total: inGroup.length,
            have: inGroup.filter((p) => collected[p.id]).length,
          };
        })
        .filter((row) => row.total > 0);

    return {
      total,
      have,
      byRarity: breakdown("rarity", RARITIES),
      byPlan: breakdown("plan", PLANS),
      byIdol: ALL_IDOLS.map((idol) => {
        const inGroup = filteredPIdols.filter((p) => p.idolId === idol.id);
        return {
          value: idol.id,
          idol,
          total: inGroup.length,
          have: inGroup.filter((p) => collected[p.id]).length,
        };
      }).filter((row) => row.total > 0),
    };
  }, [filteredPIdols, collected]);

  const overallPct = pct(stats.have, stats.total);

  const selectAllInFilter = useCallback(() => {
    setCollected((prev) => {
      const next = { ...prev };
      filteredPIdols.forEach((p) => {
        next[p.id] = true;
      });
      return next;
    });
  }, [filteredPIdols, setCollected]);

  const clearAllInFilter = useCallback(() => {
    setCollected((prev) => {
      const next = { ...prev };
      filteredPIdols.forEach((p) => {
        delete next[p.id];
      });
      return next;
    });
  }, [filteredPIdols, setCollected]);

  const shareToX = useCallback(() => {
    const scopeKey = buildShareScopeKey(filters);
    const idol = filters.idolId ? Idols.getById(filters.idolId) : null;
    const scope = t(`shareScope.${scopeKey}`, {
      rarity: filters.rarity || "",
      plan: filters.plan ? t(`plans.${filters.plan}`) : "",
      idol: idol?.name || "",
    });
    const text = t("shareText", {
      have: stats.have,
      total: stats.total,
      percent: overallPct,
      scope,
    });
    const url = `${SITE_URL}${localePath(locale, "/dex/collection/p-idols")}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text,
    )}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, "_blank");
  }, [filters, stats, overallPct, locale, t]);

  return (
    <div className={styles.collection}>
      <div className={styles.filters}>
        <RaritySelect
          selected={filters.rarity}
          onChange={(v) => setFilter("rarity", v)}
        />
        <IconSelect
          options={planOptions}
          selected={filters.plan}
          onChange={(v) => setFilter("plan", v)}
          includeAll
          collapsable
        />
        <IconSelect
          options={idolOptions}
          selected={filters.idolId}
          onChange={(v) => setFilter("idolId", v)}
          includeAll
          collapsable
        />
      </div>

      <div className={styles.summary}>
        <div className={styles.overall}>
          <div className={styles.overallLabel}>{t("collected")}</div>
          <div className={styles.overallNumbers}>
            <span className={styles.have}>{stats.have}</span>
            <span className={styles.slash}>/</span>
            <span className={styles.total}>{stats.total}</span>
            <span className={styles.percent}>{overallPct}%</span>
          </div>
          <div className={styles.bar}>
            <div
              className={styles.barFill}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className={styles.bulkActions}>
            <button
              type="button"
              onClick={selectAllInFilter}
              disabled={stats.total > 0 && stats.have === stats.total}
            >
              {t("markAll")}
            </button>
            <button
              type="button"
              onClick={clearAllInFilter}
              disabled={stats.have === 0}
            >
              {t("clearAll")}
            </button>
            <button
              type="button"
              className={styles.shareButton}
              onClick={shareToX}
            >
              <FaXTwitter />
              {t("share")}
            </button>
          </div>
        </div>

        <div className={styles.breakdowns}>
          {BREAKDOWNS.map(({ filterKey, statsKey, labelKey, iconFor }) => (
            <BreakdownGroup
              key={filterKey}
              label={t(labelKey)}
              rows={stats[statsKey].map((row) => {
                const { src, width, height, alt } = iconFor(row);
                const active = filters[filterKey] === row.value;
                return {
                  key: row.value,
                  icon: (
                    <Image src={src} width={width} height={height} alt={alt} />
                  ),
                  have: row.have,
                  total: row.total,
                  active,
                  onClick: () =>
                    setFilter(filterKey, active ? null : row.value),
                };
              })}
            />
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {filteredPIdols.map((pIdol) => (
          <PIdolTile
            key={pIdol.id}
            pIdol={pIdol}
            signatureCard={SIGNATURE_CARD_BY_PIDOL[pIdol.id]}
            collected={!!collected[pIdol.id]}
            onToggle={toggle}
          />
        ))}
        {filteredPIdols.length === 0 && (
          <div className={styles.empty}>{t("emptyResults")}</div>
        )}
      </div>
    </div>
  );
}

export default memo(PIdolCollection);
