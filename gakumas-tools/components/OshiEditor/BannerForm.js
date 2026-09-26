import { useRef, useState } from "react";
import { Idols } from "gakumas-data";
import gkImg from "gakumas-images";
import Button from "@/components/Button";
import ButtonGroup from "@/components/ButtonGroup";
import Checkbox from "@/components/Checkbox";
import IconSelect from "@/components/IconSelect";
import Input from "@/components/Input";
import Oshi from "@/components/Oshi";
import TabGroup from "@/components/TabGroup";
import { routing } from "@/i18n/routing";
import c from "@/utils/classNames";
import { idolToken, normalizeColor, oshiProps } from "@/utils/oshi";
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

const IDOLS = Idols.getAll().map((idol) => ({
  id: idol.id,
  iconSrc: gkImg(idol).icon,
  alt: idol.name,
}));

const SWATCHES = [
  { name: "gk-orange", color: "#f39800" },
  { name: "vocal", color: "#f23584" },
  { name: "dance", color: "#1c85ed" },
  { name: "visual", color: "#f7b12e" },
  { name: "saki", color: "#e2041b" },
  { name: "temari", color: "#007bbb" },
  { name: "kotone", color: "#f7c114" },
  { name: "mao", color: "#7f1184" },
  { name: "lilja", color: "#eafdff" },
  { name: "china", color: "#f68b1f" },
  { name: "sumika", color: "#7cfc00" },
  { name: "hiro", color: "#00afcc" },
  { name: "rinami", color: "#f6adc6" },
  { name: "ume", color: "#ea533a" },
  { name: "sena", color: "#f6ae54" },
  { name: "misuzu", color: "#7a99cf" },
  { name: "pxw-mao", color: "#fa7abc" },
  { name: "suukawa", color: "#f566a4" },
  { name: "maokoku", color: "#f8bdbd" },
  { name: "payton", color: "#36b596" },
  { name: "mishima", color: "#9446ac" },
  { name: "colorful", color: "#fbdb16" },
];

export default function BannerForm({ banner, onChange, onDelete }) {
  const textRef = useRef(null);
  const [language, setLanguage] = useState(routing.defaultLocale);
  const text = banner.text[language];

  function setText(value) {
    onChange({ text: { ...banner.text, [language]: value } });
  }

  function insertIdol(idolId) {
    const input = textRef.current;
    const token = idolToken(idolId);
    const start = input?.selectionStart ?? text.length;
    const end = input?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + token + text.slice(end));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <div className={styles.form}>
      <div className={styles.preview}>
        <div className={styles.navbarEdge} />
        <Oshi
          key={`${banner.id}-${banner.action}-${banner.initiallyExpanded}`}
          {...oshiProps(banner, language)}
        />
      </div>

      <Checkbox
        label="Enabled"
        checked={banner.enabled}
        onChange={(enabled) => onChange({ enabled })}
      />

      <div className={styles.field}>
        <span className={styles.label}>Text</span>
        <TabGroup
          options={LANGUAGES}
          selected={language}
          onChange={setLanguage}
        />
        <Input
          ref={textRef}
          className={styles.text}
          value={text}
          placeholder={
            language == routing.defaultLocale
              ? ""
              : banner.text[routing.defaultLocale]
          }
          onChange={setText}
        />
        <span className={styles.hint}>
          Tap an idol to insert their icon at the cursor. Empty languages use
          the Japanese text.
        </span>
        <IconSelect options={IDOLS} selected={null} onChange={insertIdol} />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Colour</span>
        <div className={styles.swatches}>
          {SWATCHES.map(({ name, color }) => (
            <button
              key={color}
              type="button"
              className={c(
                styles.swatch,
                banner.color == color && styles.selected
              )}
              style={{ backgroundColor: color }}
              aria-label={name}
              aria-pressed={banner.color == color}
              data-tooltip-id="panel-info-tooltip"
              data-tooltip-content={name}
              onClick={() => onChange({ color })}
            />
          ))}
        </div>
        <label className={styles.hex}>
          <span aria-hidden="true">#</span>
          <Input
            className={styles.text}
            value={banner.color.replace(/^#/, "")}
            aria-label="Hex colour"
            onChange={(value) => onChange({ color: normalizeColor(value) })}
          />
        </label>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Opens</span>
        <ButtonGroup
          options={ACTIONS}
          selected={banner.action}
          onChange={(action) => onChange({ action })}
        />
      </div>

      <label className={styles.field}>
        <span className={styles.label}>URL</span>
        <Input
          className={styles.text}
          type="url"
          value={banner.url}
          placeholder="https://"
          onChange={(url) => onChange({ url })}
        />
      </label>

      <div className={styles.row}>
        <Checkbox
          label="Start expanded"
          checked={banner.initiallyExpanded}
          onChange={(initiallyExpanded) => onChange({ initiallyExpanded })}
        />
        <Checkbox
          label="Red dot while collapsed"
          checked={banner.hasBadge}
          onChange={(hasBadge) => onChange({ hasBadge })}
        />
      </div>

      <div className={styles.schedule}>
        <label className={styles.field}>
          <span className={styles.label}>Show from (JST)</span>
          <Input
            className={styles.text}
            type="datetime-local"
            value={banner.startsAt}
            onChange={(startsAt) => onChange({ startsAt })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Show until (JST)</span>
          <Input
            className={styles.text}
            type="datetime-local"
            value={banner.endsAt}
            onChange={(endsAt) => onChange({ endsAt })}
          />
        </label>
      </div>

      <div>
        <Button style="red-secondary" size="sm" onClick={onDelete}>
          Delete banner
        </Button>
      </div>
    </div>
  );
}
