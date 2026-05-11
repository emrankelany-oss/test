// Scroll reveal observer
function useReveal() {
  React.useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// Custom cursor
function Cursor() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const move = (e) => {
      if (!ref.current) return;
      ref.current.style.left = e.clientX + "px";
      ref.current.style.top = e.clientY + "px";
    };
    const lg = (on) => () => ref.current?.classList.toggle("lg", on);
    window.addEventListener("mousemove", move);
    document.querySelectorAll("a, button, .work-row, .service, .insight, .logo-cell, .opp-row")
      .forEach((el) => {
        el.addEventListener("mouseenter", lg(true));
        el.addEventListener("mouseleave", lg(false));
      });
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} className="cursor" />;
}

const tickers1 = [
  "BRAND STRATEGY", "BOLD STORYTELLING", "GO-TO-MARKET", "EVENT EXPERIENCE",
  "PERFORMANCE GROWTH", "CONTENT STUDIO", "AMMAN ↔ RIYADH",
];
const tickers2 = [
  "BRAND STRATEGY", "BRAND DESIGN", "GO-TO-MARKET", "GROWTH MARKETING",
  "EVENT EXPERIENCE", "PRODUCT MARKETING", "SOCIAL & COMMUNITY", "CONTENT STUDIO",
];

function useScrolledNav() {
  React.useEffect(() => {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      // Trigger once we've scrolled past most of the hero
      const threshold = window.innerHeight * 0.85;
      nav.classList.toggle("scrolled", y > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

function App() {
  useReveal();
  useScrolledNav();
  return (
    <>
      <Cursor />
      <Nav />
      <Hero />
      <Marquee items={tickers1} />
      <Manifesto />
      <Marquee items={tickers2} inv />
      <Services />
      <Proof />
      <ProofBand />
      <Clients />
      <About />
      <Insights />
      <Careers />
      <Contact />
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
