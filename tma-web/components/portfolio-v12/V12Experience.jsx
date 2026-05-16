"use client";

import { MotionConfig } from "framer-motion";
import OpeningSequence from "./sections/01-OpeningSequence.jsx";
import Philosophy from "./sections/02-Philosophy.jsx";
import Ecosystem from "./sections/03-Ecosystem.jsx";
import FeaturedProjects from "./sections/04-FeaturedProjects.jsx";
import MotionReel from "./sections/05-MotionReel.jsx";
import BehindTheMotion from "./sections/06-BehindTheMotion.jsx";
import SocialProof from "./sections/07-SocialProof.jsx";
import Climax from "./sections/08-Climax.jsx";
import FinalCTA from "./sections/09-FinalCTA.jsx";

export default function V12Experience() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="v12-content">
        <OpeningSequence />
        <Philosophy />
        <Ecosystem />
        <FeaturedProjects />
        <MotionReel />
        <BehindTheMotion />
        <SocialProof />
        <Climax />
        <FinalCTA />
      </div>
    </MotionConfig>
  );
}
