"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export default function CourseBodyParallax({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 86%", "end 24%"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [28, -18]);
  const opacity = useTransform(scrollYProgress, [0, 0.16, 1], [0.86, 1, 1]);

  return (
    <motion.div
      ref={ref}
      className="course-rich-body course-rich-body-parallax"
      style={reduceMotion ? undefined : { y, opacity }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
