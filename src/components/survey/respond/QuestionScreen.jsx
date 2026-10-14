import { Info } from "lucide-react";
import { T, font, radius } from "../../../lib/tokens.js";
import Button from "../../ui/Button.jsx";

/* ================================================================== */
/* QUESTION SCREEN — the shared respondent-facing shell, built directly  */
/* from the two reference screenshots the user shared: a small circular  */
/* marker + bold prompt (+ an (i) info icon when helpText is set) up      */
/* top, the type-specific body in the middle, a dark "OK" pill bottom-    */
/* right, and a thin progress bar + "%" readout along the bottom. Every   */
/* per-type respondent body (QuestionBody.jsx's switch, plus              */
/* ToggleBoardRespond/CustomRespond) plugs into this ONE shell rather than */
/* rebuilding this chrome per type — matches how the reference images      */
/* show identical chrome across two very different question types.        */
/* ================================================================== */
export default function QuestionScreen({ prompt, helpText, progress, onOk, okDisabled, children }) {
  return (
    <div style={{ width: 480, maxWidth: "92vw", background: T.white, borderRadius: radius.xxl, border: `1px solid ${T.gray100}`, display: "flex", flexDirection: "column", fontFamily: font, boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ padding: "24px 24px 8px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: radius.full, background: T.gray800 }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, paddingTop: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: T.gray900, lineHeight: 1.35 }}>{prompt || "Untitled question"}</span>
          {helpText && <Info size={15} color={T.gray400} style={{ flexShrink: 0 }} title={helpText} />}
        </div>
      </div>

      <div style={{ padding: "12px 24px 24px", maxHeight: "50vh", overflowY: "auto" }}>{children}</div>

      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 24px 20px" }}>
        <Button theme="brand" variation="primary" size="sm" shape="round" onClick={onOk} disabled={okDisabled}>OK</Button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 24px 18px" }}>
        <div style={{ flex: 1, height: 4, borderRadius: radius.full, background: T.gray100, overflow: "hidden" }}>
          <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: T.gray800, transition: "width 200ms ease" }} />
        </div>
        <span style={{ fontSize: 11, color: T.gray400, flexShrink: 0 }}>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}
