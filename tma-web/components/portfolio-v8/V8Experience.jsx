"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { v8Rooms, v8Hero, v8Stats, v8Projects, v8Services, v8Cta } from "@/data/portfolio-v8";
import HeroRoom from "./rooms/HeroRoom";
import StatsRoom from "./rooms/StatsRoom";
import WorkRoom from "./rooms/WorkRoom";
import ServicesRoom from "./rooms/ServicesRoom";
import CtaRoom from "./rooms/CtaRoom";
import AudioBus from "./AudioBus";
import { useV8Scroll } from "./useV8Scroll";
import V8Mobile from "./V8Mobile";

/* progressRef is the source of truth; rooms read it inside useFrame.
 * Each room sits inside its own Suspense so a slow asset in one room
 * (drei <Text> font, image textures) cannot suspend the rest of the scene.
 */
function SceneRouter({ progressRef, roomKey, workMounted }) {
  return (
    <>
      <HeroRoom progressRef={progressRef} isOn={roomKey === "hero"} />
      <Suspense fallback={null}>
        <StatsRoom progressRef={progressRef} isOn={roomKey === "stats"} />
      </Suspense>
      <Suspense fallback={null}>
        <ServicesRoom progressRef={progressRef} isOn={roomKey === "services"} />
      </Suspense>
      <Suspense fallback={null}>
        <CtaRoom progressRef={progressRef} isOn={roomKey === "cta"} />
      </Suspense>
      {workMounted && (
        <Suspense fallback={null}>
          <WorkRoom progressRef={progressRef} isOn={roomKey === "work"} />
        </Suspense>
      )}
    </>
  );
}

function Words({ text }) {
  return text.split(" ").map((w, i) => (
    <span className="word" key={`${w}-${i}`}>
      <i>{w}&nbsp;</i>
    </span>
  ));
}

function FlipText({ text }) {
  return (
    <span className="v8-flip" data-cursor="View">
      {Array.from(text).map((ch, i) => (
        <span className="char" style={{ "--i": i }} key={i}>
          <span>{ch === " " ? " " : ch}</span>
          <span>{ch === " " ? " " : ch}</span>
        </span>
      ))}
    </span>
  );
}

export default function V8Experience() {
  const progressRef = useRef(0);              // smoothed scene progress [0,1]
  const targetRef   = useRef(0);              // wheel/key/touch accumulator
  const [roomKey, setRoomKey]   = useState("hero");
  const [progressUI, setProgressUI] = useState(0);
  const [audioOn, setAudioOn]   = useState(false);
  const [booting, setBooting]   = useState(true);
  const [loadPct, setLoadPct]   = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const cursorRef = useRef(null);
  const [workMounted, setWorkMounted] = useState(false);
  const [glLost, setGlLost] = useState(false);
  const [diag, setDiag] = useState({ canvas: false, frames: 0 });

  /* ---------- mobile detection ---------- */
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width: 900px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ---------- preloader: fake-but-paced load ---------- */
  useEffect(() => {
    if (isMobile) { setBooting(false); return; }
    let n = 0;
    const step = () => {
      n = Math.min(100, n + Math.random() * 7 + 2);
      setLoadPct(Math.floor(n));
      if (n >= 100) {
        setTimeout(() => setBooting(false), 350);
      } else {
        setTimeout(step, 80);
      }
    };
    step();
  }, [isMobile]);

  /* ---------- virtual scroll engine ---------- */
  useV8Scroll({ targetRef, progressRef, onProgress: setProgressUI, locked: booting || isMobile });

  /* ---------- room dispatch (re-renders only when room changes) ---------- */
  useEffect(() => {
    if (isMobile) return;
    let raf = 0;
    const tick = () => {
      const p = progressRef.current;
      const room = v8Rooms.find(r => p >= r.range[0] && p < r.range[1]) || v8Rooms[v8Rooms.length - 1];
      if (room.key !== roomKey) setRoomKey(room.key);
      // mount the work room and start fetching tile textures once we're near
      if (!workMounted && p > 0.30) setWorkMounted(true);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [roomKey, isMobile, workMounted]);

  /* ---------- custom cursor ---------- */
  useEffect(() => {
    if (isMobile) return;
    const el = cursorRef.current;
    if (!el) return;
    let mx = 0, my = 0, cx = 0, cy = 0;
    const move = e => { mx = e.clientX; my = e.clientY; };
    const tick = () => {
      cx += (mx - cx) * 0.22;
      cy += (my - cy) * 0.22;
      el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    const onOver = e => {
      const t = e.target.closest("[data-cursor]");
      if (t) {
        el.classList.add("is-hover");
        const label = el.querySelector(".v8-cursor-label");
        if (label) label.textContent = t.dataset.cursor || "";
      }
    };
    const onOut = e => {
      const t = e.target.closest("[data-cursor]");
      if (t && !e.relatedTarget?.closest?.("[data-cursor]")) el.classList.remove("is-hover");
    };
    let raf = requestAnimationFrame(tick);
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout",  onOut);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout",  onOut);
    };
  }, [isMobile]);

  const roomIndex = useMemo(
    () => v8Rooms.findIndex(r => r.key === roomKey),
    [roomKey]
  );

  if (isMobile) return <V8Mobile />;

  return (
    <>
      <Canvas
        className="v8-canvas"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 6], fov: 42, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#0a0a0a"));
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          setDiag(d => ({ ...d, canvas: true }));
          const canvas = gl.domElement;
          canvas.addEventListener("webglcontextlost", e => {
            e.preventDefault();
            setGlLost(true);
            canvas.style.display = "none";
          });
        }}
      >
        <fog attach="fog" args={["#0a0a0a", 14, 40]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 8, 6]} intensity={2.2} />
        <directionalLight position={[-6, -3, 4]} intensity={0.8} color="#33e6ff" />
        <directionalLight position={[3, -5, 2]} intensity={0.6} color="#ff3df3" />
        <pointLight position={[0, 0, 4]} intensity={1.0} color="#ffffff" distance={12} />
        <Suspense fallback={null}>
          <SceneRouter progressRef={progressRef} roomKey={roomKey} workMounted={workMounted} />
        </Suspense>
      </Canvas>

      <div className="v8-overlay">
        <nav className="v8-nav">
          <a className="v8-mark" href="/" data-cursor="Home"><b>TMA</b>&nbsp;/&nbsp;PORTFOLIO V8</a>
          <div className="v8-nav-right">
            <button
              className={`v8-pill ${audioOn ? "is-on" : ""}`}
              onClick={() => setAudioOn(v => !v)}
              data-cursor={audioOn ? "Mute" : "Sound on"}
            >
              {audioOn ? "Sound on" : "Sound off"}
            </button>
            <a className="v8-pill" href="mailto:info@themotionagency.net" data-cursor="Email">
              Let's talk
            </a>
          </div>
        </nav>

        <div className="v8-room-badge">
          0{roomIndex + 1} / 0{v8Rooms.length} &nbsp;·&nbsp; <b>{labelFor(roomKey)}</b>
        </div>

        <div className="v8-diag" title="Diagnostics — remove for production">
          {glLost
            ? "WEBGL CONTEXT LOST"
            : diag.canvas
              ? `WEBGL OK · ${roomKey.toUpperCase()} · ${Math.round(progressUI * 100)}%`
              : "WEBGL MOUNTING…"}
        </div>

        <div className="v8-progress">
          <div
            className="v8-progress-fill"
            style={{ transform: `scaleY(${progressUI})` }}
          />
        </div>
        <div className="v8-progress-label">Scroll {Math.round(progressUI * 100)}%</div>

        {/* ----- Room-specific copy ----- */}
        <div className={`v8-copy v8-hero-copy ${roomKey === "hero" ? "is-on" : ""}`}>
          <div className="v8-eyebrow">{v8Hero.eyebrow}</div>
          <h1 className="v8-h1"><Words text={v8Hero.headline} /></h1>
        </div>

        <div className={`v8-copy v8-stats-copy ${roomKey === "stats" ? "is-on" : ""}`}>
          <div className="v8-eyebrow">How we help</div>
          <h2>The numbers behind bold work.</h2>
          <p>Built across Amman & Riyadh. From early-stage scale-ups to unicorns and category leaders.</p>
        </div>

        <div className={`v8-copy v8-work-copy ${roomKey === "work" ? "is-on" : ""}`}>
          <div className="v8-eyebrow">Featured work</div>
          <h2>Bold ideas, brought to market.</h2>
          <p>Six campaigns from the last four years that shaped categories and grew brands by triple digits.</p>
        </div>

        <div className={`v8-copy v8-services-copy ${roomKey === "services" ? "is-on" : ""}`}>
          <div className="v8-eyebrow">What we do</div>
          <h2>Eight services, one playbook.</h2>
          <p>Strategy, design, and storytelling — all under one roof so every campaign moves in the same direction.</p>
        </div>

        <div className={`v8-copy v8-cta-copy ${roomKey === "cta" ? "is-on" : ""}`}>
          <div className="inner">
            <div className="v8-eyebrow">{v8Cta.eyebrow}</div>
            <h2>
              Let's build <em>bold stories</em><br/>with strategic impact.
            </h2>
            <div className="v8-cta-actions">
              <a className="is-primary" href={v8Cta.primary.href} data-cursor="Send">{v8Cta.primary.label}</a>
              <a href={v8Cta.secondary.href} data-cursor="Open">{v8Cta.secondary.label}</a>
            </div>
          </div>
          <div className="v8-cta-offices">
            {v8Cta.offices.map(o => (
              <div key={o.city}>
                <b>{o.city}</b>
                <span>{o.street}</span>
                <span>{o.tel}</span>
              </div>
            ))}
            <div>
              <b>General</b>
              <span><a href="mailto:info@themotionagency.net" data-cursor="Email">info@themotionagency.net</a></span>
              <span>themotionagency.net</span>
            </div>
          </div>
        </div>

        <div className={`v8-scroll-hint ${roomKey === "cta" ? "is-hidden" : ""}`}>{v8Hero.scrollHint}</div>
      </div>

      <div className="v8-cursor" ref={cursorRef}>
        <span className="v8-cursor-label"></span>
      </div>

      <Preloader pct={loadPct} done={!booting} />

      <AudioBus on={audioOn} roomKey={roomKey} />

      {/* The list of project flip titles + project tile copy lives inside WorkRoom */}
      {roomKey === "work" && (
        <div style={{
          position: "absolute", right: "5vw", bottom: "10vh",
          textAlign: "right", pointerEvents: "auto", zIndex: 4,
          maxWidth: "44%",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            {v8Projects.map(p => (
              <a
                key={p.slug}
                href={p.href}
                data-cursor="Open"
                style={{
                  color: "#fff", textDecoration: "none",
                  fontSize: "clamp(20px, 2.4vw, 36px)",
                  lineHeight: 1.1, fontWeight: 500,
                  letterSpacing: "-0.02em",
                }}
              >
                <FlipText text={p.title} />
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Preloader({ pct, done }) {
  const total = 12;
  const filled = Math.round((pct / 100) * total);
  return (
    <div className={`v8-pre ${done ? "is-done" : ""}`}>
      <div className="v8-pre-title">The Motion Agency — Loading the experience</div>
      <div className="v8-pre-counter">
        <b>{String(pct).padStart(3, "0")}</b>
        <span style={{ opacity: 0.4 }}>/100</span>
      </div>
      <div className="v8-pre-strip">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={i < filled ? "on" : ""} />
        ))}
      </div>
    </div>
  );
}

function labelFor(key) {
  switch (key) {
    case "hero": return "OPENING";
    case "stats": return "BY THE NUMBERS";
    case "work": return "SELECTED WORK";
    case "services": return "SERVICES";
    case "cta": return "LET'S TALK";
    default: return "";
  }
}
