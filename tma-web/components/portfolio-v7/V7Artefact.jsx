"use client";
import { motion } from "framer-motion";
import Tape from "./atoms/Tape";
import Pin from "./atoms/Pin";

// A taped/pinned wrapper for any "artefact" — polaroid, OOH thumb, mockup, swatch.
// Children render inside the rotated frame. Pin/tape decoration is optional.
export default function V7Artefact({
  children,
  rotation = -3,
  pin = "tape",       // "tape" | "pin" | "none"
  pinColor = "#D43A3A",
  tapeColor = "#FCE38A",
  tapeWidth = 96,
  tapeRotation = 0,
  tapePosition = "top",  // "top" | "topLeft" | "topRight"
  width,
  className = "",
  ariaLabel,
}) {
  const tapeStyle = {
    top: { left: "50%", top: -12, transform: "translateX(-50%)" },
    topLeft: { left: 8, top: -10 },
    topRight: { right: 8, top: -10 },
  }[tapePosition] || { left: "50%", top: -12, transform: "translateX(-50%)" };

  return (
    <motion.div
      className={`v7-artefact ${className}`}
      style={{ width }}
      initial={{ opacity: 0, y: 24, rotate: rotation - 6 }}
      whileInView={{ opacity: 1, y: 0, rotate: rotation }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        type: "spring",
        stiffness: 110,
        damping: 14,
        mass: 0.9,
      }}
      whileHover={{
        rotate: rotation - 1,
        y: -4,
        transition: { type: "spring", stiffness: 220, damping: 18 },
      }}
      aria-label={ariaLabel}
    >
      {pin === "tape" && (
        <div className="v7-artefact-tape-wrap" style={tapeStyle}>
          <Tape width={tapeWidth} color={tapeColor} rotation={tapeRotation} />
        </div>
      )}
      {pin === "pin" && (
        <div className="v7-artefact-pin-wrap">
          <Pin color={pinColor} size={22} />
        </div>
      )}
      <div className="v7-artefact-body">{children}</div>
    </motion.div>
  );
}
