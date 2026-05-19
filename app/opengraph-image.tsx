import { ImageResponse } from "next/og";

export const alt = "MonoForge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#080808",
          color: "#f7f7f7",
          fontFamily: "Arial",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "0 0 0 0",
            background: "radial-gradient(circle at 78% 32%, rgba(255,255,255,0.16), transparent 30%), linear-gradient(90deg, rgba(8,8,8,0) 0%, rgba(8,8,8,0.2) 55%, rgba(8,8,8,0.82) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 104,
            top: 86,
            width: 310,
            height: 310,
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 999,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 208,
            top: 126,
            width: 1,
            height: 360,
            background: "rgba(255,255,255,0.16)",
            transform: "rotate(42deg)",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            padding: 62,
            gap: 44,
          }}
        >
          <div
            style={{
              width: 154,
              height: 154,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 34,
              background: "#0d0d0d",
              boxShadow: "0 24px 70px rgba(0,0,0,0.42)",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", left: 31, top: 30, width: 34, height: 8, background: "#a3a3a3" }} />
            <div style={{ position: "absolute", right: 31, top: 30, width: 34, height: 8, background: "#a3a3a3" }} />
            <div style={{ position: "absolute", left: 31, bottom: 30, width: 34, height: 8, background: "#a3a3a3" }} />
            <div style={{ position: "absolute", right: 31, bottom: 30, width: 34, height: 8, background: "#a3a3a3" }} />
            <div style={{ fontSize: 92, fontWeight: 900, lineHeight: 1, color: "#f6f6f6", letterSpacing: -6 }}>M</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 720 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#b8b8b8", fontSize: 20, letterSpacing: 8, marginBottom: 28 }}>
              <span style={{ width: 11, height: 11, borderRadius: 999, background: "#f7f7f7" }} />
              MONOFORGE
            </div>
            <div style={{ fontSize: 70, fontWeight: 820, lineHeight: 0.96, letterSpacing: -2, maxWidth: 760 }}>
              Minimal project hosting
            </div>
            <div style={{ marginTop: 28, fontSize: 27, lineHeight: 1.35, color: "#d7d7d7", maxWidth: 720 }}>
              A quiet monochrome space for repositories, folders, README pages and issues.
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 42, fontSize: 17, color: "#dadada" }}>
              {["repo:init", "folder:upload", "readme:preview", "issues"].map((item) => (
                <div key={item} style={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "10px 16px", background: "rgba(255,255,255,0.035)" }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
