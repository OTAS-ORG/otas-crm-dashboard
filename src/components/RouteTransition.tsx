import { type ReactNode } from "react";
import { Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Maps a pathname to its top-level route "group". Navigating *within* the
 * authenticated app shell (e.g. Pre-Sale → Invoices) keeps the same group, so
 * the full-page crossfade below does NOT retrigger — those transitions stay
 * owned by <AnimatedOutlet />. Only crossing between login / public / onboarding
 * and the app shell changes the group and triggers the crossfade.
 */
function getRouteGroup(pathname: string): string {
  if (pathname.startsWith("/login")) return "login";
  if (pathname.startsWith("/public")) return "public";
  if (pathname.startsWith("/onboarding")) return "onboarding";
  return "app";
}

/**
 * Full-page fade wrapper for a top-level route element (Login, the app Layout,
 * public/onboarding forms).
 *
 * Enter-only by design — no `exit`. The source screen removes itself the moment
 * its auth state flips (`Login` redirects once logged in; `ProtectedRoute`
 * redirects to /login the instant `user` becomes null on logout), so keeping it
 * mounted for an exit animation would only render a stale/null-user snapshot.
 * Letting the destination fade in gives a clean crossfade in both directions.
 */
export function FadeTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0.001 : 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedRoutesProps {
  /** The <Route> elements, passed straight through to <Routes>. */
  children: ReactNode;
}

/**
 * Wraps the top-level <Routes> in AnimatePresence, keyed by route group, so
 * switching between the login screen and the app shell crossfades. Must be
 * rendered inside <Router> (it calls useLocation()).
 *
 * - keyed by group, not pathname → in-app navigation keeps the Layout mounted
 *   and is handled by <AnimatedOutlet /> instead.
 * - `initial={false}` → no animation on first load / hard refresh.
 */
export function AnimatedRoutes({ children }: AnimatedRoutesProps) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={getRouteGroup(location.pathname)}>
        {children}
      </Routes>
    </AnimatePresence>
  );
}

export default AnimatedRoutes;
