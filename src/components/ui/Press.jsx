import { motion } from "motion/react";
import { font } from "../../lib/tokens.js";

/* A plain button that gives a little under the finger (0.97 on press, springs
   back) — the "respond on pointer-down" rule from the Apple interaction notes.
   Unstyled otherwise: pass `style`/`className` for everything else. */
export default function Press({ children, style, ...rest }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} transition={{ type: "spring", bounce: 0, duration: 0.15 }} style={{ fontFamily: font, cursor: "pointer", ...style }} {...rest}>
      {children}
    </motion.button>
  );
}
