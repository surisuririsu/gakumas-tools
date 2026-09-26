"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import c from "@/utils/classNames";
import {
  DEFAULT_BANNER,
  bannerStatus,
  validateOshiSettings,
} from "@/utils/oshi";
import BannerForm from "./BannerForm";
import styles from "./OshiEditor.module.scss";

const STATUS_LABELS = {
  showing: "Showing",
  hidden: "Hidden by a newer banner",
  scheduled: "Scheduled",
  ended: "Ended",
  off: "Off",
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toJstInput(date) {
  if (!date) return "";
  return new Date(new Date(date).getTime() + JST_OFFSET_MS)
    .toISOString()
    .slice(0, 16);
}

function fromJstInput(value) {
  return value ? `${value}:00+09:00` : null;
}

function toForm(banner) {
  return {
    ...banner,
    startsAt: toJstInput(banner.startsAt),
    endsAt: toJstInput(banner.endsAt),
  };
}

function toPayload(banner) {
  return {
    ...banner,
    startsAt: fromJstInput(banner.startsAt),
    endsAt: fromJstInput(banner.endsAt),
  };
}

function toSchedule(banner) {
  const date = (value) => (value ? new Date(fromJstInput(value)) : null);
  return {
    ...banner,
    startsAt: date(banner.startsAt),
    endsAt: date(banner.endsAt),
  };
}

function scheduleLabel({ startsAt, endsAt }) {
  if (!startsAt && !endsAt) return "No schedule";
  const format = (value) => value.replace("T", " ");
  return `${startsAt ? format(startsAt) : "…"} → ${endsAt ? format(endsAt) : "…"}`;
}

async function putSettings(payload) {
  try {
    const res = await fetch("/api/oshi", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return {};
    const { error } = await res.json().catch(() => ({}));
    return { error: error ?? `Save failed (${res.status})` };
  } catch {
    return { error: "Save failed" };
  }
}

export default function OshiEditor({ initialSettings }) {
  const router = useRouter();
  const [banners, setBanners] = useState(() =>
    initialSettings.banners.map(toForm)
  );
  const [savedBanners, setSavedBanners] = useState(banners);
  const [selectedId, setSelectedId] = useState(banners[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const payload = { banners: banners.map(toPayload) };
  const { error, index: errorIndex } = validateOshiSettings(payload);
  const dirty = JSON.stringify(banners) != JSON.stringify(savedBanners);
  const scheduled = banners.map(toSchedule);
  const now = new Date();
  const selected = banners.find(({ id }) => id == selectedId);
  const message = error
    ? { text: error, tone: "error" }
    : (notice ?? (dirty ? { text: "Unsaved changes" } : null));

  function change(nextBanners) {
    setBanners(nextBanners);
    setNotice(null);
  }

  function updateSelected(changes) {
    change(
      banners.map((banner) =>
        banner.id == selectedId ? { ...banner, ...changes } : banner
      )
    );
  }

  function add() {
    const banner = toForm({ ...DEFAULT_BANNER, id: crypto.randomUUID() });
    change([...banners, banner]);
    setSelectedId(banner.id);
  }

  function remove() {
    const index = banners.findIndex(({ id }) => id == selectedId);
    const remaining = banners.filter(({ id }) => id != selectedId);
    change(remaining);
    setSelectedId(remaining[Math.min(index, remaining.length - 1)]?.id);
  }

  async function save() {
    setSaving(true);
    const { error } = await putSettings(payload);
    setSaving(false);

    if (error) {
      setNotice({ text: error, tone: "error" });
    } else {
      setSavedBanners(banners);
      setNotice({ text: "Saved", tone: "success" });
      router.refresh();
    }
  }

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <h1 className={styles.title}>Oshi banners</h1>
        <Button size="sm" onClick={add}>
          Add banner
        </Button>
      </div>

      <div className={styles.list}>
        {banners.length == 0 && (
          <span className={styles.hint}>No banners yet.</span>
        )}
        {banners.map((banner, i) => {
          const status = bannerStatus(scheduled[i], scheduled, now);
          return (
            <button
              key={banner.id}
              type="button"
              className={c(
                styles.item,
                banner.id == selectedId && styles.selected,
                i == errorIndex && styles.invalid
              )}
              onClick={() => setSelectedId(banner.id)}
            >
              <span
                className={styles.dot}
                style={{ backgroundColor: banner.color }}
              />
              <span className={styles.summary}>
                <span className={styles.summaryText}>
                  {banner.text.ja || "Untitled"}
                </span>
                <span className={styles.summarySchedule}>
                  {scheduleLabel(banner)}
                </span>
              </span>
              <span className={c(styles.status, styles[status])}>
                {STATUS_LABELS[status]}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <BannerForm
          key={selected.id}
          banner={selected}
          onChange={updateSelected}
          onDelete={remove}
        />
      )}

      <div className={styles.footer}>
        <span className={c(styles.message, message && styles[message.tone])}>
          {message?.text}
        </span>
        <Button
          style="primary"
          onClick={save}
          disabled={!dirty || !!error || saving}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
