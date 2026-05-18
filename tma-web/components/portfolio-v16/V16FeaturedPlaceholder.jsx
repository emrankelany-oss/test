"use client";
// FeaturedProjectScaleGallery placeholder. The data-v16-featured-gallery hook
// is the wiring point for a real scroll-scale gallery later — do not rename it.
export default function V16FeaturedPlaceholder() {
  return (
    <section
      data-v16-featured
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "clamp(64px, 12vh, 160px) 6vw",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(32px, 6vh, 80px)",
      }}
    >
      {/* energy guide: faint vertical streak echoing the hero debris */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: 2,
          height: "22vh",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(to bottom, rgba(90,166,255,0) 0%, rgba(90,166,255,0.5) 60%, rgba(90,166,255,0) 100%)",
          pointerEvents: "none",
        }}
      />
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--display)",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          lineHeight: 0.98,
          fontSize: "clamp(40px, 9vw, 160px)",
        }}
      >
        Featured Projects
      </h2>
      <div
        data-v16-featured-gallery
        style={{
          flex: 1,
          minHeight: "48vh",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 4,
          display: "grid",
          placeItems: "center",
          color: "rgba(255,255,255,0.4)",
          fontFamily: "var(--mono)",
          fontSize: 13,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Scroll-scale gallery — coming soon
      </div>
    </section>
  );
}
