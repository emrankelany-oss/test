"use client";

import { useRef } from "react";
import "./v12.css";
import { LaunchSequenceProvider } from "./LaunchSequenceContext.jsx";
import { useLaunchScroll } from "./useLaunchScroll.js";
import AtmosphereLayer from "./AtmosphereLayer.jsx";
import HUD from "./HUD.jsx";
import AudioController from "./AudioController.jsx";
import V12Experience from "./V12Experience.jsx";

function Inner() {
  const rootRef = useRef(null);
  useLaunchScroll(rootRef);
  return (
    <main ref={rootRef} className="v12" data-v12-root>
      <a href="#v12-main" className="v12-skip">
        Skip to content
      </a>
      <AtmosphereLayer />
      <div id="v12-main">
        <V12Experience />
      </div>
      <HUD />
      <AudioController />
    </main>
  );
}

export default function V12ClientRoot() {
  return (
    <LaunchSequenceProvider>
      <Inner />
    </LaunchSequenceProvider>
  );
}
