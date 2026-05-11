"use client";
import { useEffect, useRef } from "react";

export default function ClientShell({ enableScrolledNav = true }) {
  const cursorRef = useRef(null);

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!enableScrolledNav) return;
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      const threshold = window.innerHeight * 0.85;
      nav.classList.toggle("scrolled", y > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enableScrolledNav]);

  useEffect(() => {
    const move = (e) => {
      if (!cursorRef.current) return;
      cursorRef.current.style.left = e.clientX + "px";
      cursorRef.current.style.top = e.clientY + "px";
    };
    window.addEventListener("mousemove", move);
    const els = document.querySelectorAll(
      "a, button, .work-row, .service, .insight, .logo-cell, .opp-row, .role-row-head"
    );
    const enter = () => cursorRef.current?.classList.add("lg");
    const leave = () => cursorRef.current?.classList.remove("lg");
    els.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });
    return () => {
      window.removeEventListener("mousemove", move);
      els.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  return <div ref={cursorRef} className="cursor" />;
}
