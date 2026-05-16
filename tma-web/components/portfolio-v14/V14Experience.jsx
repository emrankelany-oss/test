"use client";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import { SceneControllerProvider } from "@/components/portfolio-v14/engine/SceneController";
import ProbeSceneA from "@/components/portfolio-v14/scenes/ProbeSceneA";
import PlaceholderFilmScene from "@/components/portfolio-v14/scenes/PlaceholderFilmScene";
import ProbeSceneB from "@/components/portfolio-v14/scenes/ProbeSceneB";

export default function V14Experience() {
  return (
    <SceneControllerProvider>
      <SmoothScroll />
      <ProbeSceneA />
      <PlaceholderFilmScene />
      <ProbeSceneB />
    </SceneControllerProvider>
  );
}
