import ObsidianHero from "@/components/obsidian-hero/ObsidianHero";

export const metadata = {
  title: "Obsidian Hero — The Motion Agency",
  description:
    "WebGL relief-lamp signature hero: an obsidian booster engine with a blue gem core, lit by the cursor.",
};

export default function ObsidianHeroPage() {
  return (
    <main>
      <ObsidianHero />
      <section style={{ height: "120vh", background: "#060708" }} aria-hidden="true" />
    </main>
  );
}
