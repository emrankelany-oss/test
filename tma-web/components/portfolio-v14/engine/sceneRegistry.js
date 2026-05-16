export function createSceneRegistry() {
  let scenes = [];

  return {
    register(scene) {
      if (scenes.some((s) => s.id === scene.id)) {
        throw new Error(`Scene id "${scene.id}" already registered`);
      }
      scenes = [...scenes, scene].sort((a, b) => a.order - b.order);
      return () => {
        scenes = scenes.filter((s) => s.id !== scene.id);
      };
    },
    list() {
      return scenes.slice();
    },
    adjacentPairs() {
      const out = [];
      for (let i = 0; i < scenes.length - 1; i++) out.push([scenes[i], scenes[i + 1]]);
      return out;
    },
  };
}
