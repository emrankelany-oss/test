"use client";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import { SceneControllerProvider } from "@/components/portfolio-v14/engine/SceneController";
import IntroFilmScene from "@/components/portfolio-v14/scenes/IntroFilmScene";
import ManifestoScene from "@/components/portfolio-v14/scenes/ManifestoScene";
import ChapterScene from "@/components/portfolio-v14/scenes/ChapterScene";
import { foodics } from "@/components/portfolio-v14/chapters/foodics";
import { zid } from "@/components/portfolio-v14/chapters/zid";

export default function V14Experience() {
  return (
    <SceneControllerProvider>
      <SmoothScroll />
      <IntroFilmScene />
      <ManifestoScene />
      <ChapterScene chapter={foodics} />
      <ChapterScene chapter={zid} />
    </SceneControllerProvider>
  );
}
