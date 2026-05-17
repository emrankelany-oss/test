"use client";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import { SceneControllerProvider } from "@/components/portfolio-v14/engine/SceneController";
import ProbeSceneA from "@/components/portfolio-v14/scenes/ProbeSceneA";
import IntroFilmScene from "@/components/portfolio-v14/scenes/IntroFilmScene";
import ProbeSceneB from "@/components/portfolio-v14/scenes/ProbeSceneB";

export default function V14Experience() {
  return (
    <SceneControllerProvider>
      <SmoothScroll />
      <ProbeSceneA />
      <IntroFilmScene />
      <ProbeSceneB />
    </SceneControllerProvider>
  );
}
