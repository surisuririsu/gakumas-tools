import { memo } from "react";
import { Link } from "@/i18n/routing";
import c from "@/utils/classNames";
import styles from "./IconButton.module.scss";

// Icon-only control: `ariaLabel` is the accessible name, since the icon
// itself carries none.
function IconButton({
  icon: Icon,
  onClick,
  href,
  disabled,
  size = "medium",
  tone,
  ariaLabel,
}) {
  const className = c(
    styles.iconButton,
    styles[size],
    tone && styles[tone],
    disabled && styles.disabled
  );

  return href ? (
    <Link
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
    >
      <Icon aria-hidden="true" />
    </Link>
  ) : (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}

export default memo(IconButton);
