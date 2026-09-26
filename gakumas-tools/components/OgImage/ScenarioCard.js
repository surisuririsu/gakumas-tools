import { Bar, Footer, Page, Raised, Watermark } from "./parts";
import { COLORS, RANK_BACKGROUNDS, SITE_HOST } from "./theme";

const TITLE_WIDTH = 500;
const TITLE_SIZE = 70;

// Without spaces a CJK title would wrap mid-word, so it breaks where the
// script changes (katakana to kanji) nearest the middle.
function titleLines(title) {
  if (/\s/.test(title)) return [title];
  const script = (ch) =>
    /[゠-ヿ]/.test(ch) ? "kana" : /\p{Script=Han}/u.test(ch) ? "han" : "other";
  const chars = [...title];
  const middle = chars.length / 2;
  let split = -1;
  for (let i = 1; i < chars.length; i++) {
    if (script(chars[i]) == script(chars[i - 1])) continue;
    if (split < 0 || Math.abs(i - middle) < Math.abs(split - middle)) split = i;
  }
  if (split < 0) return [title];
  return [chars.slice(0, split).join(""), chars.slice(split).join("")];
}

function titleSize(title, lines) {
  if (/\s/.test(title)) return TITLE_SIZE;
  const longest = Math.max(...lines.map((line) => [...line].length));
  return Math.min(TITLE_SIZE, Math.floor(TITLE_WIDTH / longest));
}

function ScenarioChip({ name, color, edge }) {
  return (
    <Raised
      radius={23}
      edge={edge}
      depth={5}
      style={{
        padding: "11px 32px",
        backgroundColor: color,
        color: "#ffffff",
        fontSize: 38,
        fontWeight: 800,
        letterSpacing: 1.5,
        lineHeight: 1.1,
      }}
    >
      {name.toUpperCase()}
    </Raised>
  );
}

function RankBadges({ badges }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        width: 398,
        padding: 20,
        borderRadius: 28,
        backgroundColor: COLORS.panel,
        boxShadow: `0 4px 0 ${COLORS.border}, 0 18px 40px rgba(20, 20, 40, 0.08)`,
      }}
    >
      {badges.map(({ rank, src }) => (
        <div
          key={rank}
          style={{
            display: "flex",
            width: 172,
            height: 172,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 26,
            ...RANK_BACKGROUNDS[rank],
          }}
        >
          <img src={src} width={128} height={128} />
        </div>
      ))}
    </div>
  );
}

export default function ScenarioCard({ scenarioName, title, colors, badges }) {
  const lines = titleLines(title);
  return (
    <Page>
      <Watermark size={200} style={{ top: -30, left: 40 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0,
          width: 80 + TITLE_WIDTH,
          padding: "78px 0 56px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <ScenarioChip name={scenarioName} {...colors} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 34,
              fontSize: titleSize(title, lines),
              fontWeight: 800,
              wordBreak: "keep-all",
              letterSpacing: -1.5,
              lineHeight: 1.12,
            }}
          >
            {lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 26 }}>
            <Bar
              width={84}
              height={12}
              color={colors.color}
              edge={colors.edge}
            />
          </div>
        </div>
        <Footer
          size={40}
          host={SITE_HOST}
          style={{
            justifyContent: "flex-start",
            alignItems: "baseline",
            gap: 18,
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingRight: 40,
        }}
      >
        <RankBadges badges={badges} />
      </div>
    </Page>
  );
}
