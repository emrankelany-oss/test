"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useV16FrameSequence } from "./useV16FrameSequence";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { TEXT_BEATS, EXPLOSION_RANGE, PIN_VIEWPORTS } from "./engine/frameSequence.js";
import GradientVignette from "./overlays/GradientVignette";
import GrainLayer from "./overlays/GrainLayer";
import BlueGlow from "./overlays/BlueGlow";
import ParticleField from "./overlays/ParticleField";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const B = TEXT_BEATS;
const [BAND_LO, BAND_HI] = EXPLOSION_RANGE;

export default function V16Hero() {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const glowRef = useRef(null);
  const shakeRef = useRef(null);
  const progressRef = useRef(0); // live scroll progress for ParticleField
  const progress = useMotionValue(reduced ? 1 : 0);

  const { canvasRef, ready, setTargetProgress } = useV16FrameSequence({
    onReady: () => ScrollTrigger.refresh(),
  });

  // text beats: reveal in, hold, fade at fadeOut beat (archive stays)
  const labelOpacity = useTransform(progress, [B.label, B.label + 0.04, B.fadeOut, B.fadeOut + 0.05], [0, 1, 1, 0]);
  const labelY = useTransform(progress, [B.label, B.label + 0.04], [18, 0]);
  const h1Opacity = useTransform(progress, [B.headline1, B.headline1 + 0.05, B.fadeOut, B.fadeOut + 0.05], [0, 1, 1, 0]);
  const h1Y = useTransform(progress, [B.headline1, B.headline1 + 0.05], [40, 0]);
  const h2Opacity = useTransform(progress, [B.headline2, B.headline2 + 0.05, B.fadeOut, B.fadeOut + 0.05], [0, 1, 1, 0]);
  const h2Y = useTransform(progress, [B.headline2, B.headline2 + 0.05], [40, 0]);
  const archiveOpacity = useTransform(progress, [B.archive, B.archive + 0.04], [0, 1]);
  const archiveY = useTransform(progress, [B.archive, B.archive + 0.04], [16, 0]);
  const headlineGlow = useTransform(
    progress,
    [BAND_LO, (BAND_LO + BAND_HI) / 2, BAND_HI],
    ["0 0 0px rgba(90,166,255,0)", "0 0 26px rgba(90,166,255,0.85)", "0 0 0px rgba(90,166,255,0)"]
  );

  // ScrollTrigger pin + scrub. Reduced motion: no pin, static last frame.
  useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    if (!sectionRef.current || !stickyRef.current) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: `+=${PIN_VIEWPORTS * 100}%`,
        pin: stickyRef.current,
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;
          progress.set(p);
          setTargetProgress(p);
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced, progress, setTargetProgress]);

  // reduced motion: pin off → drive frame engine to the last frame once
  useEffect(() => {
    if (reduced) {
      setTargetProgress(1);
      progressRef.current = 1;
    }
  }, [reduced, setTargetProgress]);

  // explosion-band screen shake (transform only, decays at band edges)
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const loop = () => {
      const p = progressRef.current;
      const el = shakeRef.current;
      if (el) {
        let amp = 0;
        if (p > BAND_LO && p < BAND_HI) {
          const mid = (BAND_LO + BAND_HI) / 2;
          amp = (1 - Math.abs((p - mid) / ((BAND_HI - BAND_LO) / 2))) * 7;
        }
        const t = performance.now() / 1000;
        el.style.transform = `translate3d(${Math.sin(t * 47) * amp}px, ${Math.cos(t * 53) * amp}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // subtle mouse parallax on the blue glow (disabled under reduced motion)
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 26;
        const y = (e.clientY / window.innerHeight - 0.5) * 26;
        if (glowRef.current) glowRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const textBaseStyle = {
    margin: 0,
    fontFamily: "var(--display)",
    color: "#fff",
    textTransform: "uppercase",
  };

  return (
    <section
      ref={sectionRef}
      data-v16-hero
      style={{ position: "relative", height: `${(PIN_VIEWPORTS + 1) * 100}vh`, background: "#000" }}
    >
      <div
        ref={stickyRef}
        style={{
          position: "relative",
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          background: "#000",
        }}
      >
        <div ref={shakeRef} style={{ position: "absolute", inset: 0, willChange: "transform" }}>
          <canvas
            ref={canvasRef}
            data-v16-canvas
            style={{ display: "block", width: "100%", height: "100%" }}
          />
          <GradientVignette />
          <BlueGlow ref={glowRef} />
          <GrainLayer />
          {!reduced && <ParticleField progressRef={progressRef} />}

          {!ready && (
            <div
              data-v16-loading
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: "#000",
                zIndex: 5,
              }}
            >
              <div
                className="v16-loader-glow"
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(56,132,255,0.45) 0%, rgba(56,132,255,0) 70%)",
                }}
              />
            </div>
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 6vw",
              zIndex: 6,
              pointerEvents: "none",
            }}
          >
            <motion.p
              style={{
                ...textBaseStyle,
                opacity: reduced ? 1 : labelOpacity,
                y: reduced ? 0 : labelY,
                letterSpacing: "0.42em",
                fontSize: "clamp(11px, 1vw, 14px)",
                marginBottom: "clamp(18px, 3vh, 36px)",
                color: "#7db4ff",
              }}
            >
              THE MOTION AGENCY
            </motion.p>
            <motion.h2
              style={{
                ...textBaseStyle,
                opacity: reduced ? 1 : h1Opacity,
                y: reduced ? 0 : h1Y,
                textShadow: reduced ? "none" : headlineGlow,
                fontWeight: 800,
                lineHeight: 1.02,
                fontSize: "clamp(34px, 6.4vw, 104px)",
              }}
            >
              WE DON&rsquo;T BUILD BRANDS.
            </motion.h2>
            <motion.h2
              style={{
                ...textBaseStyle,
                opacity: reduced ? 1 : h2Opacity,
                y: reduced ? 0 : h2Y,
                textShadow: reduced ? "none" : headlineGlow,
                fontWeight: 800,
                lineHeight: 1.02,
                fontSize: "clamp(34px, 6.4vw, 104px)",
              }}
            >
              WE RELEASE MOMENTUM.
            </motion.h2>
            <motion.p
              data-v16-archive
              style={{
                ...textBaseStyle,
                opacity: reduced ? 1 : archiveOpacity,
                y: reduced ? 0 : archiveY,
                letterSpacing: "0.34em",
                fontSize: "clamp(12px, 1.1vw, 16px)",
                marginTop: "clamp(28px, 5vh, 60px)",
                color: "#7db4ff",
              }}
            >
              ENTER THE ARCHIVE
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
