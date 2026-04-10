import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import gkImg from "gakumas-images";
import {
  deserializeEffectSequence as deserializeLegacyEffectSequence,
} from "gakumas-data";
import {
  parseEffects,
  transformEffects,
} from "gakumas-data-structured";
import { getReviewDataset } from "../../../../../packages/gakumas-data-structured/review/index.js";
import Button from "@/components/Button";
import Image from "@/components/Image";
import styles from "./page.module.scss";

const DATASETS = {
  skillCards: {
    label: "Skill Cards",
    imageType: "skillCard",
    fields: ["conditions", "cost", "effects", "growth"],
  },
  pItems: {
    label: "P-Items",
    imageType: "pItem",
    fields: ["effects"],
  },
  pDrinks: {
    label: "Drinks",
    imageType: "pDrink",
    fields: ["effects"],
  },
  stages: {
    label: "Stages",
    fields: ["effects"],
  },
  customizations: {
    label: "Customizations",
    fields: ["conditions", "cost", "effects", "growth"],
  },
};

const DEFAULT_DATASET_TYPE = "skillCards";
const EFFECT_KEYWORDS = new Set([
  "at",
  "if",
  "target",
  "do",
  "limit",
  "ttl",
  "delay",
  "level",
  "line",
  "group",
]);
const EFFECT_TOKEN_PATTERN =
  /(at|if|target|do|limit|ttl|delay|level|line|group|[{}\[\]();,]|[+\-*/%&|!<>=]=?|:)/g;
const PUNCTUATION_PATTERN = /^[{}\[\]();,]$/;
const OPERATOR_PATTERN = /^[+\-*/%&|!<>=]=?|:$/;

export const metadata = {
  title: "Effect Verification",
};

export const dynamic = "force-dynamic";

function getSelectedType(query) {
  return DATASETS[query?.type] ? query.type : DEFAULT_DATASET_TYPE;
}

function getSelectedId(query) {
  if (query?.id === undefined || query?.id === null || query.id === "") {
    return null;
  }

  return String(query.id);
}

function getSelectedEntry(entries, selectedId) {
  if (!entries.length) {
    return null;
  }

  const selectedIndex =
    selectedId === null
      ? 0
      : Math.max(
          entries.findIndex((entry) => String(entry.id) === selectedId),
          0,
        );

  return {
    index: selectedIndex,
    entry: entries[selectedIndex],
  };
}

function getEntityName(entity) {
  return entity?.name || entity?.alias || "Unknown";
}

function getEntityDetails(entity) {
  return [entity?.rarity, entity?.plan, entity?.type, entity?.mode]
    .filter(Boolean)
    .join(" · ");
}

function getTypeUrl(type) {
  return `/admin/effects?type=${type}`;
}

function getEntityUrl(type, id) {
  return `/admin/effects?type=${type}&id=${id}`;
}

function getEffectText(value) {
  return typeof value === "string" ? value : "";
}

function tokenizeEffect(value) {
  return (getEffectText(value) || "(empty)").split(EFFECT_TOKEN_PATTERN);
}

function JsonBlock({ value }) {
  return (
    <pre className={styles.json}>
      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
}

function EffectCode({ value }) {
  return (
    <pre className={styles.code}>
      {tokenizeEffect(value).map((part, index) => {
        if (!part) return null;
        if (EFFECT_KEYWORDS.has(part)) {
          return (
            <span className={styles.keyword} key={index}>
              {part}
            </span>
          );
        }
        if (PUNCTUATION_PATTERN.test(part)) {
          return (
            <span className={styles.punctuation} key={index}>
              {part}
            </span>
          );
        }
        if (OPERATOR_PATTERN.test(part)) {
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

function parseLegacy(value) {
  if (typeof value !== "string") {
    return {
      ok: false,
      error: `Expected string, received ${typeof value}`,
    };
  }

  try {
    return {
      ok: true,
      value: deserializeLegacyEffectSequence(value),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

function parseStructured(value) {
  if (typeof value !== "string") {
    return {
      ok: false,
      error: `Expected string, received ${typeof value}`,
    };
  }

  try {
    const ast = parseEffects(value);
    return {
      ok: true,
      ast,
      engine: transformEffects(ast),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

function reviewField(field, legacyEntry, structuredEntry) {
  const legacyValue = getEffectText(legacyEntry?.[field]);
  const structuredValue = getEffectText(structuredEntry?.[field]);
  const legacy = parseLegacy(legacyValue);
  const structured = parseStructured(structuredValue);

  return {
    field,
    legacyValue,
    structuredValue,
    legacy,
    structured,
  };
}

function EntityImage({ type, entity }) {
  if (!type || !entity) return null;

  const entityName = getEntityName(entity);
  const { details } = gkImg({
    _type: type,
    id: entity.id,
    name: entityName,
  });

  if (!details) return null;

  return (
    <aside className={styles.imagePanel}>
      <div className={styles.imageFrame}>
        <Image
          src={details}
          alt={entityName}
          width={480}
          height={680}
          draggable={false}
        />
      </div>
    </aside>
  );
}

function EffectField({ review }) {
  return (
    <section className={styles.field}>
      <div className={styles.fieldHeader}>
        <h3>{review.field}</h3>
      </div>
      <div className={styles.stringGrid}>
        <div>
          <h4>Legacy</h4>
          <EffectCode value={review.legacyValue} />
        </div>
        <div>
          <h4>Structured</h4>
          <EffectCode value={review.structuredValue} />
        </div>
      </div>
      <details className={styles.parsedDetails}>
        <summary>Parsed output</summary>
        <div className={styles.parsedGrid}>
          <div className={styles.parsedColumn}>
            <div className={styles.parsedLabel}>Legacy engine object</div>
            {review.legacy.ok ? (
              <JsonBlock value={review.legacy.value} />
            ) : (
              <pre className={styles.error}>{review.legacy.error}</pre>
            )}
          </div>
          <div className={styles.parsedColumn}>
            <div className={styles.parsedLabel}>Structured AST</div>
            {review.structured.ok ? (
              <JsonBlock value={review.structured.ast} />
            ) : (
              <pre className={styles.error}>{review.structured.error}</pre>
            )}
            {review.structured.ok ? (
              <>
                <div className={styles.parsedLabel}>
                  Structured engine object
                </div>
                <JsonBlock value={review.structured.engine} />
              </>
            ) : null}
          </div>
        </div>
      </details>
    </section>
  );
}

async function getReviewPageState(searchParams) {
  const query = await searchParams;
  const type = getSelectedType(query);
  const dataset = await getReviewDataset(type);
  const selected = getSelectedEntry(dataset.entries, getSelectedId(query));

  if (!selected?.entry) {
    notFound();
  }

  const legacyEntry = dataset.getLegacyById(selected.entry.id);
  const structuredEntry = dataset.getStructuredById(selected.entry.id);

  if (!legacyEntry || !structuredEntry) {
    notFound();
  }

  const reviews = DATASETS[type].fields.map((field) =>
    reviewField(field, legacyEntry, structuredEntry),
  );

  return {
    type,
    dataset,
    selectedIndex: selected.index,
    legacyEntry,
    reviews,
    prevEntry: dataset.entries[selected.index - 1] || null,
    nextEntry: dataset.entries[selected.index + 1] || null,
  };
}

export default async function EffectVerificationPage({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const {
    type,
    dataset,
    selectedIndex,
    legacyEntry,
    reviews,
    prevEntry,
    nextEntry,
  } = await getReviewPageState(searchParams);
  const entityName = getEntityName(legacyEntry);
  const entityDetails = getEntityDetails(legacyEntry);

  return (
    <div className={styles.page}>
      <nav className={styles.typeNav}>
        {Object.entries(DATASETS).map(([key, value]) => (
          <Button
            href={getTypeUrl(key)}
            key={key}
            style={key === type ? "primary" : "secondary"}
          >
            {value.label}
          </Button>
        ))}
      </nav>

      <main className={styles.review}>
        <section className={styles.controls}>
          <form action={`/${locale}/admin/effects`} className={styles.selectForm}>
            <input name="type" type="hidden" value={type} />
            <label className={styles.selectLabel} htmlFor="effect-entry-id">
              Entity
            </label>
            <select
              className={styles.select}
              defaultValue={String(legacyEntry.id)}
              id="effect-entry-id"
              name="id"
            >
              {dataset.entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.id} · {entry.name}
                </option>
              ))}
            </select>
            <button className={styles.selectButton} type="submit">
              Open
            </button>
          </form>

          <div className={styles.navButtons}>
            <Button
              disabled={!prevEntry}
              href={
                prevEntry ? getEntityUrl(type, prevEntry.id) : undefined
              }
              style="secondary"
            >
              Previous
            </Button>
            <Button
              disabled={!nextEntry}
              href={
                nextEntry ? getEntityUrl(type, nextEntry.id) : undefined
              }
              style="secondary"
            >
              Next
            </Button>
          </div>
        </section>

        <div className={styles.entityHeader}>
          <div>
            <p className={styles.eyebrow}>{DATASETS[type].label}</p>
            <h2>{entityName}</h2>
            <p className={styles.meta}>
              #{legacyEntry.id}
              {entityDetails ? ` · ${entityDetails}` : ""}
            </p>
          </div>
          <div className={styles.position}>
            {selectedIndex + 1} / {dataset.entries.length}
          </div>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.effects}>
            {reviews.map((review) => (
              <EffectField key={review.field} review={review} />
            ))}
          </div>
          <EntityImage type={DATASETS[type].imageType} entity={legacyEntry} />
        </div>
      </main>
    </div>
  );
}
