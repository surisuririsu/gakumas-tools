export function iconSrc(icon, imageMap) {
  if (!icon) return null;
  const key = typeof icon === "string" ? icon : icon.src;
  return imageMap?.[key] || key;
}
