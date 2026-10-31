import { ImageResponse } from "next/og";
import { EXAMPLE_SHARED, parseShared, safeCheck } from "@/lib/share";

const LABEL: Record<string, string> = { on_track: "On track", plan: "Plan", quarantine_risk: "Detention risk", deadline_passed: "Deadline passed", redo_required: "Fix a step" };

export async function GET(req: Request) {
  const shared = parseShared(new URL(req.url).searchParams) ?? EXAMPLE_SHARED;
  const r = safeCheck(shared) ?? safeCheck(EXAMPLE_SHARED)!;
  const bad = r.verdict === "deadline_passed" || r.verdict === "redo_required";
  const stats = [
    r.dates.earliestArrival ? { label: "earliest arrival", value: r.dates.earliestArrival } : null,
    r.dates.notifyAqsBy ? { label: "notify AQS by", value: r.dates.notifyAqsBy } : null,
    r.dates.exportApplyBy ? { label: "export application by", value: r.dates.exportApplyBy } : null,
    { label: "quarantine", value: r.quarantine.expected.slice(0, 22) },
  ].filter(Boolean).slice(0, 3) as { label: string; value: string }[];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f0b429" }}>Japan Pet Quarantine Check</div>
          <div style={{ display: "flex", fontSize: 22, color: "#9b9588" }}>rules as of {r.rulesAsOf}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 34, color: "#c9c3b6" }}>{`${LABEL[r.verdict]} · ${r.speciesLabel.split(" (")[0]}`}</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 50, fontWeight: 800, letterSpacing: "-0.02em", color: bad ? "#fca5a5" : r.verdict === "on_track" ? "#99f6e4" : "#fde68a", lineHeight: 1.15, maxWidth: 1070 }}>{r.summary.slice(0, 150)}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", flex: 1, border: "2px solid #23252c", borderRadius: 24, padding: "14px 20px", background: "#101218" }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: "#f3efe4" }}>{s.value}</span>
              <span style={{ fontSize: 20, color: "#9b9588" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#6f6a60" }}>
          <span>japan-pet-quarantine.vercel.app · free, no login</span>
          <span>Educational. Not affiliated with MAFF / AQS.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
