import { COLORS, FONT_FAMILY, WATERMARK_FONT_FAMILY } from "./theme";

export function Page({ children, style }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: COLORS.page,
        color: COLORS.ink,
        fontFamily: FONT_FAMILY,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// The app's hard bottom edge, drawn as a taller backing layer: a box-shadow
// would be an SVG filter per element, which resvg renders slowly.
export function Raised({ radius, edge, depth = 2, style, children }) {
  return (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        paddingBottom: depth,
        borderRadius: radius,
        backgroundColor: edge,
      }}
    >
      <div style={{ display: "flex", borderRadius: radius, ...style }}>
        {children}
      </div>
    </div>
  );
}

// react-icons render through a context consumer, which satori can't walk, so
// draw the icon's paths into a plain <svg>.
export function IconGlyph({ icon, size, color }) {
  const { attr, children } = icon.type(icon.props).props;
  return (
    <svg viewBox={attr.viewBox} width={size} height={size} fill={color}>
      {children}
    </svg>
  );
}

export function IconTile({
  icon,
  size,
  tint = COLORS.accentTint,
  edge = COLORS.accentEdge,
  ink = COLORS.accentInk,
}) {
  return (
    <Raised
      radius={Math.round(size * 0.27)}
      edge={edge}
      depth={Math.round(size / 22)}
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: tint,
      }}
    >
      <IconGlyph icon={icon} size={Math.round(size * 0.42)} color={ink} />
    </Raised>
  );
}

export function Wordmark({ size }) {
  return (
    <div
      style={{
        display: "flex",
        gap: size * 0.22,
        fontSize: size,
        fontWeight: 800,
        letterSpacing: -size * 0.02,
        lineHeight: 1.1,
      }}
    >
      <span style={{ color: COLORS.ink }}>Gakumas</span>
      <span style={{ color: COLORS.accentInk }}>Tools</span>
    </div>
  );
}

export function Bar({
  width,
  height,
  color = COLORS.brand,
  edge = COLORS.brandEdge,
}) {
  return (
    <Raised
      radius={height / 2}
      edge={edge}
      depth={Math.round(height * 0.4)}
      style={{ width, height, backgroundColor: color }}
    />
  );
}

// satori drops the outline of text with a transparent fill, so the fill
// matches the page instead.
export function Watermark({ size, style }) {
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        fontFamily: WATERMARK_FONT_FAMILY,
        fontSize: size,
        color: COLORS.page,
        WebkitTextStrokeWidth: Math.max(2, Math.round(size / 60)),
        WebkitTextStrokeColor: "rgba(20, 20, 40, 0.08)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      学マスツール
    </div>
  );
}

export function Footer({ size, host, style }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        ...style,
      }}
    >
      <Wordmark size={size} />
      <div
        style={{
          display: "flex",
          fontSize: Math.round(size * 0.68),
          fontWeight: 600,
          color: COLORS.faint,
        }}
      >
        {host}
      </div>
    </div>
  );
}
