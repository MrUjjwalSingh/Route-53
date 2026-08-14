"use client";

import { useEffect, useState } from "react";

import Box from "@cloudscape-design/components/box";

interface Slide {
  tag: string;
  headline: string;
  gradient: string;
  href: string;
}

const SLIDES: Slide[] = [
  {
    tag: "Features",
    headline: "Route traffic with weighted, latency, and failover policies",
    gradient: "linear-gradient(135deg, #0b1f45 0%, #1a3a8f 45%, #3b6ff2 100%)",
    href: "#features",
  },
  {
    tag: "Getting started",
    headline: "Create a hosted zone and your first record set in minutes",
    gradient: "linear-gradient(135deg, #1a0b45 0%, #4a1a8f 45%, #8a3bf2 100%)",
    href: "/login",
  },
  {
    tag: "Reliability",
    headline: "Automatic NS/SOA setup and change propagation, every time",
    gradient: "linear-gradient(135deg, #45170b 0%, #8f2f1a 45%, #f2603b 100%)",
    href: "#benefits",
  },
];

const ROTATE_MS = 6000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index];

  return (
    <div style={{ padding: "1.5rem 2rem 0" }}>
      <a
        href={slide.href}
        style={{
          display: "block",
          borderRadius: "16px",
          overflow: "hidden",
          textDecoration: "none",
          background: slide.gradient,
          minHeight: "220px",
          padding: "2rem",
          position: "relative",
        }}
      >
        <span
          style={{
            display: "inline-block",
            background: "rgba(0,0,0,0.35)",
            color: "#fff",
            fontSize: "12px",
            padding: "4px 10px",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          {slide.tag}
        </span>
        <Box variant="h2" color="inherit">
          <span style={{ color: "#fff" }}>{slide.headline}</span>
        </Box>
        <span style={{ color: "#fff", fontSize: "14px" }}>Learn more →</span>
      </a>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.75rem 0",
        }}
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.tag}
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setIndex(i)}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: i === index ? "#3b6ff2" : "#c7c7c7",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
