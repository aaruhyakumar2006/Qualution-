import { Composition } from "remotion";
import { GroverVideo } from "./GroverVideo";
import { TraditionalVsQuantum } from "./TraditionalVsQuantum";

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="GroverInteractive"
        component={GroverVideo}
        durationInFrames={1000}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="TraditionalVsQuantum"
        component={TraditionalVsQuantum}
        durationInFrames={700}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
