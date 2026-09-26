import { Raised } from "@/components/OgImage/parts";
import { COLORS } from "@/components/OgImage/theme";
import styles from "./Preview.styles";

// Backgrounds, not <img>: satori's <img> path is superlinear in the number of
// images.
export default function PreviewIcon({ src, size, children }) {
  const radius = size * 0.06;
  if (!src) {
    return (
      <div
        style={{
          ...styles.empty,
          width: size,
          height: size,
          borderRadius: radius,
        }}
      />
    );
  }
  return (
    <Raised
      radius={radius}
      edge={COLORS.iconEdge}
      style={{
        ...styles.icon,
        width: size,
        height: size,
        backgroundImage: `url(${src})`,
        backgroundSize: `${size}px ${size}px`,
      }}
    >
      {children}
    </Raised>
  );
}
