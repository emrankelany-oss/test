// IMPACT's /work hero is a giant "WORK" word over the grid. We keep that
// editorial bigness but render it in TMA's brand spectrum (GALAXY_STOPS). The
// word rises out of a clip mask on load (css-mask-rise-stagger). The gradient +
// background-clip:text live on the text node itself; the clip mask is a
// separate wrapper, so the spectrum always paints (nesting clip + transform on
// one element breaks background-clip:text in WebKit).
export default function V26Hero() {
  return (
    <header className="v26-section v26-hero" data-v26-section="hero">
      <p className="v26-eyebrow">The Motion Agency — Selected Work</p>
      <h1 className="v26-hero-title-wrap">
        <span className="v26-hero-title">WORK</span>
      </h1>
      <p className="v26-hero-intro">
        Strategy that earns attention and storytelling that moves markets — a decade of brand,
        social, film and product work for the region's most ambitious companies.
      </p>
    </header>
  );
}
