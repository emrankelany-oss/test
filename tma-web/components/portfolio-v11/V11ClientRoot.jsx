"use client";

import dynamic from "next/dynamic";
import "./v11.css";

const V11Experience = dynamic(() => import("./V11Experience"), {
  ssr: false,
  loading: () => (
    <div className="v11-boot" aria-hidden="true">
      <div className="v11-boot-ring" />
      <div className="v11-boot-label">
        <span>BOOSTER</span>
        <span>—</span>
        <span>WARMING UP</span>
      </div>
    </div>
  ),
});

export default function V11ClientRoot() {
  return (
    <div className="v11-page" data-theme="booster">
      <V11Experience />
    </div>
  );
}
