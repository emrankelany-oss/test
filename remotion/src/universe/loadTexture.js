import { useEffect, useState } from "react";
import { delayRender, continueRender, staticFile } from "remotion";
import * as THREE from "three";

/**
 * Loads a texture from remotion/public via staticFile, holding the Remotion
 * render until the bitmap is decoded so no frame captures a blank panel.
 * Returns the THREE.Texture, or null while loading / on failure.
 */
export function useUniverseTexture(file) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    const handle = delayRender(`tex:${file}`);
    let loaded;
    new THREE.TextureLoader().load(
      staticFile(file),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        loaded = t;
        setTex(t);
        continueRender(handle);
      },
      undefined,
      (err) => {
        console.warn("[universe] texture failed", file, err);
        continueRender(handle);
      }
    );
    return () => loaded?.dispose?.();
  }, [file]);
  return tex;
}
