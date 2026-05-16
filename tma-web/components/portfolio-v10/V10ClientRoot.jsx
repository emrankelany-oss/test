"use client";

import dynamic from "next/dynamic";
import "./v10.css";

const V10Experience = dynamic(() => import("./V10Experience"), {
  ssr: false,
  loading: () => (
    <div className="v10-boot" aria-hidden="true">
      <div className="v10-boot-ring" />
      <div className="v10-boot-label">
        <span>SYSTEMS</span>
        <span>—</span>
        <span>BOOSTER ONLINE</span>
      </div>
    </div>
  ),
});

export default function V10ClientRoot() {
  return (
    <div className="v10-page" data-theme="liftoff">
      <V10Experience />
    </div>
  );
}
