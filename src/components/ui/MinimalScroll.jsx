import { useEffect, useRef, useState } from "react";

/* ================================================================== */
/* MINIMAL SCROLL — an overlay scroll indicator for a scrolling element. */
/* Give the scroller the `scroll-minimal` class (index.css hides the     */
/* native bar, so it takes no layout width) and render                   */
/* <ScrollThumb target={ref} /> as its sibling inside a position:relative */
/* parent. The thumb is 4px wide, 3px from the right edge, fully rounded, */
/* and only visible while scrolling (fades ~0.8s after) or while the      */
/* pointer is over the area; it hides when there's nothing to scroll.     */
/* It can be dragged.                                                     */
/* ================================================================== */
export function ScrollThumb({ target, top = 0, bottom = 0, color = "rgba(35, 31, 32, 0.28)" }) {
  const [m, setM] = useState({ size: 0, pos: 0, track: 0, show: false });
  const [active, setActive] = useState(false);
  const fade = useRef(0);
  useEffect(() => {
    const el = target.current;
    if (!el) return undefined;
    const measure = () => {
      const track = el.clientHeight - top - bottom;
      const ratio = el.clientHeight / Math.max(1, el.scrollHeight);
      const size = Math.max(28, track * ratio);
      const max = el.scrollHeight - el.clientHeight;
      const pos = max > 0 ? (el.scrollTop / max) * (track - size) : 0;
      setM((p) => ({ ...p, size, pos, track, show: max > 1 }));
    };
    const ping = () => { measure(); setActive(true); clearTimeout(fade.current); fade.current = setTimeout(() => setActive(false), 800); };
    const enter = () => { measure(); setActive(true); clearTimeout(fade.current); };
    const leave = () => { clearTimeout(fade.current); fade.current = setTimeout(() => setActive(false), 400); };
    measure();
    el.addEventListener("scroll", ping, { passive: true });
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    [...el.children].forEach((c) => ro.observe(c));
    return () => { el.removeEventListener("scroll", ping); el.removeEventListener("pointerenter", enter); el.removeEventListener("pointerleave", leave); ro.disconnect(); clearTimeout(fade.current); };
  }, [target, top, bottom]);
  const drag = (e) => {
    const el = target.current;
    if (!el) return;
    e.preventDefault();
    const startY = e.clientY, startTop = el.scrollTop;
    const per = (el.scrollHeight - el.clientHeight) / Math.max(1, m.track - m.size);
    const move = (ev) => { el.scrollTop = startTop + (ev.clientY - startY) * per; };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  if (!m.show) return null;
  return (
    <div
      aria-hidden="true"
      onPointerDown={drag}
      onPointerEnter={() => { clearTimeout(fade.current); setActive(true); }}
      style={{ position: "absolute", right: 3, top: top + m.pos, width: 4, height: m.size, borderRadius: 9999, background: color, opacity: active ? 1 : 0, transition: "opacity 220ms ease", zIndex: 6, cursor: "default" }}
    />
  );
}
