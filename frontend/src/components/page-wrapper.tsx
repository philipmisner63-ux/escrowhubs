"use client";

import { motion, useReducedMotion } from "framer-motion";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ y: 12, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
