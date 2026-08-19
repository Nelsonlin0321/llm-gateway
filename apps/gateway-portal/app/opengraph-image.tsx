import { ImageResponse } from "next/og";

import { siteDescription, siteName, siteTagline } from "@/lib/site";

export const alt = `${siteName} — ${siteTagline}`;
export const size = {
  width: 1200,
  height: 630,
};
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
          background: "#07090c",
          color: "#f4f5f7",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              background: "#7c3aed",
              color: "#fafafa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            GW
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6 }}>
              {siteName}
            </span>
            <span style={{ fontSize: 18, color: "#a1a1aa" }}>{siteTagline}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 58,
              fontWeight: 650,
              letterSpacing: -1.8,
              lineHeight: 1.08,
              maxWidth: 980,
            }}
          >
            Operate every provider, key, and dollar of LLM spend.
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              lineHeight: 1.4,
              maxWidth: 860,
            }}
          >
            {siteDescription}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
