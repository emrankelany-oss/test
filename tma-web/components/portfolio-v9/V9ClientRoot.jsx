"use client";

import dynamic from "next/dynamic";
import "./v9.css";

const V9Experience = dynamic(() => import("./V9Experience"), {
  ssr: false,
  loading: () => (
    <div className="v9-boot" aria-hidden="true">
      <div className="v9-boot-ring" />
      <div className="v9-boot-label">
        <span>THE SIGNAL</span>
        <span>—</span>
        <span>INITIALIZING</span>
      </div>
    </div>
  ),
});

export default function V9ClientRoot() {
  return (
    <div className="v9-page" data-theme="signal">
      <V9Experience />
    </div>
  );
}
