import { TOOLS } from "@/utils/tools";
import { Bar, IconTile, Page, Watermark, Wordmark } from "./parts";
import { COLORS, SITE_HOST } from "./theme";

export default function HomeCard() {
  return (
    <Page>
      <Watermark
        size={176}
        style={{ top: 110, left: 0, width: "100%", justifyContent: "center" }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          paddingTop: 150,
        }}
      >
        <Wordmark size={150} />
        <div style={{ display: "flex", marginTop: 22 }}>
          <Bar width={96} height={12} />
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 70 }}>
          {Object.entries(TOOLS).map(([key, { icon }]) => (
            <IconTile key={key} icon={icon} size={92} />
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 34,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          fontSize: 26,
          fontWeight: 600,
          color: COLORS.faint,
        }}
      >
        {SITE_HOST}
      </div>
    </Page>
  );
}
