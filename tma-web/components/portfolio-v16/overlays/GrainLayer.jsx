"use client";
export default function GrainLayer() {
  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
    >
      <div className="v16-grain" />
    </div>
  );
}
