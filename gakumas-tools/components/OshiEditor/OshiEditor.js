"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Idols } from "gakumas-data";
import Button from "@/components/Button";
import ButtonGroup from "@/components/ButtonGroup";
import Checkbox from "@/components/Checkbox";
import Input from "@/components/Input";
import Oshi from "@/components/Oshi";
import Select from "@/components/Select";
import TabGroup from "@/components/TabGroup";
import { routing } from "@/i18n/routing";
import c from "@/utils/classNames";
import { oshiProps, validateOshiSettings } from "@/utils/oshi";
import styles from "./OshiEditor.module.scss";

const LANGUAGES = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
  { value: "zh-Hans", label: "简体中文" },
  { value: "ko", label: "한국어" },
];

const ACTIONS = [
  { value: "link", label: "Link" },
  { value: "video", label: "YouTube video" },
];

const IDOLS = [
  { value: "", label: "None" },
  ...Idols.getAll().map(({ id, name }) => ({ value: id, label: name })),
];

const SWATCHES = [
  { name: "Brand", color: "#f39800" },
  { name: "Vocal", color: "#f23584" },
  { name: "Dance", color: "#1c85ed" },
  { name: "Visual", color: "#f7b12e" },
  { name: "Saki", color: "#e2041b" },
  { name: "Temari", color: "#007bbb" },
  { name: "Kotone", color: "#f7c114" },
  { name: "Mao", color: "#7f1184" },
  { name: "Lilja", color: "#eafdff" },
  { name: "China", color: "#f68b1f" },
  { name: "Sumika", color: "#7cfc00" },
  { name: "Hiro", color: "#00afcc" },
  { name: "Rinami", color: "#f6adc6" },
  { name: "Ume", color: "#ea533a" },
  { name: "Sena", color: "#f6ae54" },
  { name: "Misuzu", color: "#7a99cf" },
  { name: "PxW Mao", color: "#fa7abc" },
  { name: "Suukawa", color: "#f566a4" },
  { name: "Maokoku", color: "#f8bdbd" },
  { name: "Payton", color: "#36b596" },
  { name: "Mishima", color: "#9446ac" },
  { name: "Colorful", color: "#fbdb16" },
];

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

function toForm(settings) {
  return {
    ...settings,
    startsAt: toJstInput(settings.startsAt),
    endsAt: toJstInput(settings.endsAt),
  };
}

function toPayload(form) {
  return {
    ...form,
    startsAt: fromJstInput(form.startsAt),
    endsAt: fromJstInput(form.endsAt),
  };
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
  const [form, setForm] = useState(() => toForm(initialSettings));
  const [savedForm, setSavedForm] = useState(form);
  const [language, setLanguage] = useState(routing.defaultLocale);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const payload = toPayload(form);
  const { error } = validateOshiSettings(payload);
  const dirty = JSON.stringify(form) != JSON.stringify(savedForm);
  const isCustomColor = !SWATCHES.some(({ color }) => color == form.color);
  const message = error
    ? { text: error, tone: "error" }
    : (notice ?? (dirty ? { text: "Unsaved changes" } : null));

  function update(changes) {
    setForm({ ...form, ...changes });
    setNotice(null);
  }

  async function save() {
    setSaving(true);
    const { error } = await putSettings(payload);
    setSaving(false);

    if (error) {
      setNotice({ text: error, tone: "error" });
    } else {
      setSavedForm(form);
      setNotice({ text: "Saved", tone: "success" });
      router.refresh();
    }
  }

  return (
    <div className={styles.editor}>
      <h1 className={styles.title}>Oshi banner</h1>

      <div className={styles.preview}>
        <div className={styles.navbarEdge} />
        <Oshi
          key={`${form.action}-${form.initiallyExpanded}`}
          {...oshiProps(form, language)}
        />
      </div>

      <Checkbox
        label="Show banner"
        checked={form.enabled}
        onChange={(enabled) => update({ enabled })}
      />

      <div className={styles.field}>
        <span className={styles.label}>Text</span>
        <TabGroup
          options={LANGUAGES}
          selected={language}
          onChange={setLanguage}
        />
        <Input
          className={styles.text}
          value={form.text[language]}
          placeholder={
            language == routing.defaultLocale
              ? ""
              : form.text[routing.defaultLocale]
          }
          onChange={(value) =>
            update({ text: { ...form.text, [language]: value } })
          }
        />
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Idol icon</span>
        <Select
          options={IDOLS}
          value={form.idolId ?? ""}
          onChange={(idolId) => update({ idolId: idolId || null })}
        />
      </label>

      <div className={styles.field}>
        <span className={styles.label}>Colour</span>
        <div className={styles.swatches}>
          {SWATCHES.map(({ name, color }) => (
            <button
              key={color}
              type="button"
              className={c(
                styles.swatch,
                form.color == color && styles.selected
              )}
              style={{ backgroundColor: color }}
              title={name}
              aria-label={name}
              aria-pressed={form.color == color}
              onClick={() => update({ color })}
            />
          ))}
          <input
            type="color"
            className={c(styles.swatch, isCustomColor && styles.selected)}
            value={form.color}
            title="Custom"
            aria-label="Custom"
            onChange={(e) => update({ color: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Opens</span>
        <ButtonGroup
          options={ACTIONS}
          selected={form.action}
          onChange={(action) => update({ action })}
        />
      </div>

      <label className={styles.field}>
        <span className={styles.label}>URL</span>
        <Input
          className={styles.text}
          type="url"
          value={form.url}
          placeholder="https://"
          onChange={(url) => update({ url })}
        />
      </label>

      <div className={styles.row}>
        <Checkbox
          label="Start expanded"
          checked={form.initiallyExpanded}
          onChange={(initiallyExpanded) => update({ initiallyExpanded })}
        />
        <Checkbox
          label="Red dot while collapsed"
          checked={form.hasBadge}
          onChange={(hasBadge) => update({ hasBadge })}
        />
      </div>

      <div className={styles.schedule}>
        <label className={styles.field}>
          <span className={styles.label}>Show from (JST)</span>
          <Input
            className={styles.text}
            type="datetime-local"
            value={form.startsAt}
            onChange={(startsAt) => update({ startsAt })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Show until (JST)</span>
          <Input
            className={styles.text}
            type="datetime-local"
            value={form.endsAt}
            onChange={(endsAt) => update({ endsAt })}
          />
        </label>
      </div>

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
