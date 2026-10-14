import { X } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { familyById, formTitle } from "../../lib/families.js";
import WidgetBody from "../widgets/WidgetBody.jsx";
import GeneratedBody from "../widgets/GeneratedBody.jsx";
import { Header } from "../widgets/primitives.jsx";

/* ================================================================== */
/* DETAIL MODAL — opened on primary widget interaction (click).        */
/* ================================================================== */
export default function DetailModal({ widget, onClose }) {
  if (!widget) return null;
  const isLib = widget.kind === "library";
  const family = isLib ? familyById(widget.familyId) : null;
  const title = widget.customTitle || (isLib ? formTitle(widget.familyId, widget.formIndex) : widget.spec.title);
  const category = isLib ? family.category : "AI-generated";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(35,31,32,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 640, maxHeight: "80vh", overflowY: "auto", background: T.white, borderRadius: radius.modal, padding: 32, fontFamily: font }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>{category}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.gray900, marginTop: 4 }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.gray500 }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: T.gray700, marginBottom: 24 }}>
          Get a quick overview and easily compare scores in this interactive graphic. Remember, higher scores are better.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ border: `1px solid ${T.gray100}`, borderRadius: radius.widget, padding: 16, minHeight: 220, display: "flex", flexDirection: "column", gap: 12 }}>
            <Header title="Your Organisation" />
            {isLib ? <WidgetBody familyId={widget.familyId} formIndex={widget.formIndex} /> : <GeneratedBody spec={widget.spec} />}
          </div>
          <div style={{ border: `1px solid ${T.gray100}`, borderRadius: radius.widget, padding: 16, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
            <p style={{ fontSize: 13, color: T.gray900, fontWeight: 600 }}>{isLib ? "What this means" : "Why this widget"}</p>
            <p style={{ fontSize: 12, color: T.gray700, lineHeight: 1.5 }}>
              {isLib
                ? "It's operating at peak performance with a strong score. The organisation's core foundations are solid — now it's about scaling excellence and staying ahead."
                : widget.spec.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
