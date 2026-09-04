import { ImageResponse } from "next/og";

export const alt = "KNGL Dublaj — Sahneyi seslendir. Arkadaşlarınla.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #090b11 0%, #151a2a 60%, #2a1e12 100%)",
          color: "#f4f5f9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#ffb443", display: "flex" }} />
          <div style={{ fontSize: 40, fontWeight: 700 }}>KNGL Dublaj</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1 }}>Sahneyi seslendir.</div>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, color: "#ffb443" }}>Arkadaşlarınla.</div>
          <div style={{ fontSize: 30, color: "#a3a9ba", marginTop: 20 }}>Oda kur · Karakterini al · Repliklerini kaydet · Birlikte izle</div>
        </div>
      </div>
    ),
    size,
  );
}
