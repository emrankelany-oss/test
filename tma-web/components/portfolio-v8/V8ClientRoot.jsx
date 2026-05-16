"use client";

import dynamic from "next/dynamic";
import "./v8.css";

const V8Experience = dynamic(() => import("./V8Experience"), {
  ssr: false,
  loading: () => (
    <div className="v8-boot">
      <span className="v8-boot-counter">00</span>
    </div>
  ),
});

export default function V8ClientRoot() {
  return (
    <div className="v8-page">
      <V8Experience />
    </div>
  );
}
