import { createContext, useContext, useLayoutEffect, useState } from "react";

/* ================================================================== */
/* STORY WIDTH: Stories live in panes of very different widths (a       */
/* 1000px Scope, a narrow Scope beside the chat, a phone). So a Story    */
/* responds to the width of its own card, never to the browser window.   */
/* The card measures itself and shares the result:                       */
/*   compact  card narrower than 560px: stack rows, drop hover-only       */
/*            detail for tap-to-select, swap labels for numbered keys     */
/*   tight    card narrower than 400px: the most squeezed layouts          */
/* At 560px and wider nothing changes from the designed 808px layouts.    */
/* ================================================================== */
export const COMPACT_BELOW = 560;
export const TIGHT_BELOW = 400;
export const DESIGN_WIDTH = 808;

export const sizeFor = (width) => ({ width, compact: width < COMPACT_BELOW, tight: width < TIGHT_BELOW });

const Ctx = createContext(null);
export const StoryWidthProvider = Ctx.Provider;

/* The width of the Story card the caller sits in (808 outside a card, so nothing changes there). */
export const useStoryWidth = () => useContext(Ctx) || sizeFor(DESIGN_WIDTH);

/* Render-prop for a component that renders the card itself and so cannot read its own width. */
export function WithWidth({ children }) {
  return children(useStoryWidth());
}

/* Track an element's width with a ResizeObserver. Ignores 0 (a hidden pane) so layouts don't flip while it is closed. */
export function useElementWidth(ref, initial = DESIGN_WIDTH) {
  const [w, setW] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => { const x = el.offsetWidth; if (x > 0) setW((p) => (p === x ? p : x)); };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}
