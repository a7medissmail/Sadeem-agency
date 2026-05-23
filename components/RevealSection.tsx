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
    if (rest.id && window.location.hash === `#${rest.id}`) {
      setForceShow(true);
    }
  }, [rest.id]);

  return (
    <MotionTag
      className={className}
      initial="hidden"
      animate={forceShow ? "show" : undefined}
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={variants}
      transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
