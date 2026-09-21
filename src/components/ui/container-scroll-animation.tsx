"use client";

import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
      setReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const rotate = useTransform(
    scrollYProgress,
    [0, 0.4, 0.8],
    reducedMotion || isMobile ? [0, 0, 0] : [8, 0, -2]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reducedMotion || isMobile ? [1, 1, 1] : [0.97, 1, 0.99]
  );
  const translateY = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reducedMotion || isMobile ? [0, 0, 0] : [20, 0, -10]
  );

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center pt-2 pb-6 px-2 sm:px-4"
    >
      <div className="w-full relative" style={{ perspective: "1000px" }}>
        {/* Header Title Component */}
        <div className="max-w-4xl mx-auto text-center mb-6">
          {titleComponent}
        </div>

        {/* 3D Motion Card Container */}
        <motion.div
          style={{
            rotateX: rotate,
            scale,
            y: translateY,
          }}
          className="max-w-6xl mx-auto rounded-3xl bg-white/95 border border-slate-200/90 shadow-[0_12px_44px_rgba(15,23,42,0.06)] p-3 sm:p-5 backdrop-blur-md transition-shadow duration-300"
        >
          <div className="w-full overflow-hidden rounded-2xl bg-[#F8FAFC] border border-slate-100 p-4 sm:p-6">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

