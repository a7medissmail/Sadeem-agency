"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

const variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

type RevealSectionProps = {
  as?: string;
  className?: string;
  children?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// Slow, cinematic fade-upward reveal as a section scrolls into view.
export default function RevealSection({ as = "section", className, children, ...rest }: RevealSectionProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MotionTag: any = (motion as any)[as] || motion.section;
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    // Show immediately for hash-targeted sections
    if (rest.id && window.location.hash === `#${rest.id}`) {
      setForceShow(true);
      return;
    }
    // Safety net: if whileInView hasn't fired after 3 s (slow devices,
    // IntersectionObserver edge cases with Lenis), reveal content anyway.
    const t = setTimeout(() => setForceShow(true), 3000);
    return () => clearTimeout(t);
  }, [rest.id]);

  return (
    <MotionTag
      className={className}
      initial="hidden"
      animate={forceShow ? "show" : undefined}
      whileInView="show"
      viewport={{ once: true, amount: 0.08 }}
      variants={variants}
      transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
