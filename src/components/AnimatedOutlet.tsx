import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface AnimatedOutletProps {
  /** Context forwarded to the rendered route, same as <Outlet context={...} />. */
  context?: unknown;
}

/**
 * Renders the matched child route with a smooth enter/exit transition on every
 * navigation. Uses `useOutlet()` so AnimatePresence can snapshot the outgoing
 * page and keep it visible during its exit animation (avoids the "new content
 * flashes in the old slot" bug you get from keying <Outlet /> directly).
 *
 * - `mode="wait"`   → exit completes before the next page enters (no overlap).
 * - `initial={false}` → no animation on first load / hard refresh.
 * - respects `prefers-reduced-motion` by dropping the vertical slide.
 */
export function AnimatedOutlet({ context }: AnimatedOutletProps) {
  const location = useLocation();
  const outlet = useOutlet(context);
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

export default AnimatedOutlet;
