import { ImageResponse } from "next/og";

export const alt = "KNGL Dublaj — Rolünü çek. Sesini ver. Prömiyeri birlikte izle.";
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
          background: "linear-gradient(135deg, #f7f3ec 0%, #efe9dd 60%, #fde7dc 100%)",
          color: "#17181f",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#e8541e", display: "flex" }} />
          <div style={{ fontSize: 40, fontWeight: 700 }}>KNGL Dublaj</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1 }}>Rolünü çek. Sesini ver.</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1, color: "#e8541e" }}>Prömiyeri birlikte izle.</div>
          <div style={{ fontSize: 30, color: "#5b6070", marginTop: 20 }}>Ekibini topla · Rolünü çek · Sesini ver · Prömiyer</div>
        </div>
      </div>
    ),
    size,
  );
}
