import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import { deserializeEffectSequence } from "../../../../../packages/gakumas-data/utils/effects.js";
import legacyCustomizations from "../../../../../packages/gakumas-data/json/customizations.json";
import legacyPItems from "../../../../../packages/gakumas-data/json/p_items.json";
import legacySkillCards from "../../../../../packages/gakumas-data/json/skill_cards.json";
import legacyStages from "../../../../../packages/gakumas-data/json/stages.json";
import structuredCustomizations from "../../../../../packages/gakumas-data/structured/json/customizations.json";
import structuredPItems from "../../../../../packages/gakumas-data/structured/json/p_items.json";
import structuredSkillCards from "../../../../../packages/gakumas-data/structured/json/skill_cards.json";
import structuredStages from "../../../../../packages/gakumas-data/structured/json/stages.json";
import { parseEffects as parseStructuredEffects } from "../../../../../packages/gakumas-data/structured/utils/parser/index.js";
import { transformEffects as transformStructuredEffects } from "../../../../../packages/gakumas-data/structured/utils/transformer/index.js";
import styles from "./page.module.scss";

const EFFECT_FIELDS_BY_TYPE = {
  skillCards: ["conditions", "cost", "effects", "growth"],
  pItems: ["effects"],
  stages: ["effects"],
  customizations: ["conditions", "cost", "effects", "growth"],
};

const DATASETS = {
  skillCards: {
    label: "Skill Cards",
    legacy: legacySkillCards,
    structured: structuredSkillCards,
    imageType: "skillCard",
  },
  pItems: {
    label: "P-Items",
    legacy: legacyPItems,
    structured: structuredPItems,
    imageType: "pItem",
  },
  stages: {
    label: "Stages",
    legacy: legacyStages,
    structured: structuredStages,
  },
  customizations: {
    label: "Customizations",
    legacy: legacyCustomizations,
    structured: structuredCustomizations,
  },
};

export const metadata = {
  title: "Effect Verification",
};

function byId(data) {
  return new Map(data.map((entry) => [String(entry.id), entry]));
}

function getEntities(type) {
  const dataset = DATASETS[type];
  const structuredById = byId(dataset.structured);
  return dataset.legacy.map((legacy) => ({
    id: legacy.id,
    legacy,
    structured: structuredById.get(String(legacy.id)),
  }));
}

function getEntityUrl(locale, type, id) {
  return `/${locale}/admin/effects?type=${type}&id=${id}`;
}

function parseLegacy(value) {
  try {
    return { ok: true, value: deserializeEffectSequence(value || "") };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function parseStructured(value) {
  try {
    const ast = parseStructuredEffects(value || "");
    return {
      ok: true,
      ast,
      engine: transformStructuredEffects(ast),
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function JsonBlock({ value }) {
  return (
    <pre className={styles.json}>
      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
}

function EffectCode({ value }) {
  const parts = String(value || "(empty)").split(
    /(at|if|target|do|limit|ttl|delay|level|line|group|[{}\[\]();,]|[+\-*/%&|!<>=]=?|:)/g,
  );

  return (
    <pre className={styles.code}>
      {parts.map((part, index) => {
        if (!part) return null;
        if (/^(at|if|target|do|limit|ttl|delay|level|line|group)$/.test(part)) {
          return (
            <span className={styles.keyword} key={index}>
              {part}
            </span>
          );
        }
        if (/^[{}\[\]();,]$/.test(part)) {
          return (
            <span className={styles.punctuation} key={index}>
              {part}
            </span>
          );
        }
        if (/^[+\-*/%&|!<>=]=?|:$/.test(part)) {
          return (
            <span className={styles.operator} key={index}>
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </pre>
  );
}

function EntityImage({ type, entity }) {
  if (!type || !entity) return null;

  const { details } = gkImg({
    _type: type,
    id: entity.id,
    name: entity.name,
  });

  if (!details) return null;

  return (
    <aside className={styles.imagePanel}>
      <div className={styles.imageFrame}>
        <Image
          src={details}
          alt={entity.name}
          fill
          sizes="360px"
          draggable={false}
        />
      </div>
    </aside>
  );
}

function ParsedColumn({ title, parsed, structured }) {
  return (
    <div className={styles.parsedColumn}>
      <h4>{title}</h4>
      {parsed.ok ? (
        structured ? (
          <>
            <div className={styles.parsedLabel}>AST</div>
            <JsonBlock value={parsed.ast} />
            <div className={styles.parsedLabel}>Engine object</div>
            <JsonBlock value={parsed.engine} />
          </>
        ) : (
          <JsonBlock value={parsed.value} />
        )
      ) : (
        <pre className={styles.error}>{parsed.error}</pre>
      )}
    </div>
  );
}

function EffectField({ field, legacyValue, structuredValue }) {
  const legacyParsed = parseLegacy(legacyValue);
  const structuredParsed = parseStructured(structuredValue);

  return (
    <section className={styles.field}>
      <h3>{field}</h3>
      <div className={styles.stringGrid}>
        <div>
          <h4>Old string</h4>
          <EffectCode value={legacyValue} />
        </div>
        <div>
          <h4>New string</h4>
          <EffectCode value={structuredValue} />
        </div>
      </div>
      <div className={styles.parsedGrid}>
        <ParsedColumn title="Old parsed object" parsed={legacyParsed} />
        <ParsedColumn
          title="New parsed form"
          parsed={structuredParsed}
          structured
        />
      </div>
    </section>
  );
}

export default async function EffectVerificationPage({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const type = DATASETS[query.type] ? query.type : "skillCards";
  const dataset = DATASETS[type];
  const entities = getEntities(type);
  const selectedIndex = Math.max(
    entities.findIndex((entity) => String(entity.id) === String(query.id)),
    0,
  );
  const selected = entities[selectedIndex];
  const fields = EFFECT_FIELDS_BY_TYPE[type];
  const prev = entities[selectedIndex - 1];
  const next = entities[selectedIndex + 1];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1>Effect verification</h1>
          <p>
            Review legacy and structured effect syntax side by side, including
            parsed objects and AST output.
          </p>
        </div>
        <nav className={styles.typeNav}>
          {Object.entries(DATASETS).map(([key, value]) => (
            <Link
              className={key === type ? styles.activeType : ""}
              href={getEntityUrl(locale, key, getEntities(key)[0]?.id)}
              key={key}
            >
              {value.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <strong>{dataset.label}</strong>
            <span>
              {selectedIndex + 1} / {entities.length}
            </span>
          </div>
          <div className={styles.entityList}>
            {entities.map((entity) => (
              <Link
                className={entity.id === selected.id ? styles.activeEntity : ""}
                href={getEntityUrl(locale, type, entity.id)}
                key={entity.id}
              >
                <span>{entity.id}</span>
                <span>{entity.legacy.name || entity.legacy.alias}</span>
              </Link>
            ))}
          </div>
        </aside>

        <main className={styles.review}>
          <div className={styles.entityHeader}>
            <div>
              <p className={styles.eyebrow}>{dataset.label}</p>
              <h2>
                {selected.legacy.id}.{" "}
                {selected.legacy.name || selected.legacy.alias}
              </h2>
              <p>
                {selected.legacy.rarity ? `${selected.legacy.rarity} · ` : ""}
                {selected.legacy.plan || selected.legacy.type || ""}
              </p>
            </div>
            <div className={styles.navButtons}>
              {prev ? (
                <Link href={getEntityUrl(locale, type, prev.id)}>Previous</Link>
              ) : (
                <span>Previous</span>
              )}
              {next ? (
                <Link href={getEntityUrl(locale, type, next.id)}>Next</Link>
              ) : (
                <span>Next</span>
              )}
            </div>
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.effects}>
              {fields.map((field) => (
                <EffectField
                  field={field}
                  legacyValue={selected.legacy[field]}
                  structuredValue={selected.structured?.[field]}
                  key={field}
                />
              ))}
            </div>
            <EntityImage type={dataset.imageType} entity={selected.legacy} />
          </div>
        </main>
      </div>
    </div>
  );
}
