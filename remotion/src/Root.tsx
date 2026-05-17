import { Composition } from "remotion";
import { MMonument } from "./MMonument";
import { MMonumentPaper } from "./MMonumentPaper";
import { MMonumentDark } from "./MMonumentDark";
import { ProjectUniverse } from "./ProjectUniverse";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ProjectUniverse"
        component={ProjectUniverse}
        durationInFrames={180}
        fps={30}
        width={1600}
        height={1000}
      />
      <Composition
        id="MMonument"
        component={MMonument}
        durationInFrames={180}
        fps={30}
        width={1600}
        height={1000}
      />
      <Composition
        id="MMonumentPaper"
        component={MMonumentPaper}
        durationInFrames={180}
        fps={30}
        width={1600}
        height={1000}
      />
      <Composition
        id="MMonumentDark"
        component={MMonumentDark}
        durationInFrames={180}
        fps={30}
        width={1600}
        height={1000}
      />
    </>
  );
};
