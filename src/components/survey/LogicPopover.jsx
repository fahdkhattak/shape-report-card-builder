import { motion, AnimatePresence } from "motion/react";
import { FloatingPortal } from "@floating-ui/react";
import { Workflow, Trash2 } from "lucide-react";
import { T, font, radius } from "../../lib/tokens.js";
import { SelectField, TextField } from "./QuestionFields.jsx";

const POP_SPRING = { type: "spring", bounce: 0, duration: 0.2 };

/* ================================================================== */
/* LOGIC POPOVER — Survey Builder V3's "Logic" action (one of the real      */
/* Edit/Copy/Logic/Move/Delete row Survio's own question-block hover         */
/* toolbar shows). Real Survio attaches skip logic directly to the             */
/* question being answered ("Skip to" → another question / survey exit /       */
/* an external URL) rather than as a separate block in the flow — a real         */
/* structural difference from V1's node-canvas condition blocks, which live       */
/* as their own nodes wired in from a prior question. `question.skipRule`          */
/* (`{ op, value, targetId }`, `targetId` a question id or the literal              */
/* "end") is evaluated against THIS question's own just-given answer during          */
/* preview — see `PreviewModalV3.jsx`. "Your web" (an external-URL skip              */
/* target, also real in Survio) was deliberately left out: this app has no            */
/* real destination for a redirect to go to, and an inert-looking URL field            */
/* would be exactly the kind of fake functionality this project avoids                  */
/* elsewhere — the right call here was to not offer the option at all, since              */
/* unlike a purely-decorative inert row this one would affect real preview                */
/* behavior.                                                                                */
/*                                                                                           */
/* Purely presentational — positioning is owned by the caller                                */
/* (`QuestionBlockV3.jsx`'s own `useFloating` call, anchored to its "Logic"                   */
/* toolbar button) and passed in as `floatingRef`/`style`/`floatingProps`,                     */
/* the same prop shape NavRail.jsx's `FloatingMenu` already established.                        */
/* ================================================================== */
export default function LogicPopover({ open, floatingRef, style, floatingProps, question, otherRows, onPatch }) {
  const rule = question.skipRule;
  const isMultipleChoice = question.questionType === "multiple-choice";
  const setRule = (patch) => onPatch({ skipRule: { ...(rule ?? { op: "eq", value: "", targetId: "end" }), ...patch } });

  return (
    <FloatingPortal>
      <AnimatePresence>
        {open && (
          <div ref={floatingRef} {...floatingProps} style={{ ...style, zIndex: 110 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -4 }} transition={POP_SPRING}
              style={{ width: 280, background: T.white, border: `1px solid ${T.gray100}`, borderRadius: radius.lg, boxShadow: "0 16px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)", padding: 14, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 10, fontFamily: font }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: T.gray700 }}>
                <Workflow size={13} color={T.accent} />
                Skip logic
              </div>

              {!rule ? (
                <>
                  <span style={{ fontSize: 12, color: T.gray400, lineHeight: 1.5 }}>Jump respondents to a different question (or end the survey) based on their answer here.</span>
                  <button
                    onClick={() => onPatch({ skipRule: { op: "eq", value: "", targetId: "end" } })}
                    style={{ border: `1px solid ${T.gray100}`, background: T.gray50, borderRadius: radius.md, padding: "8px 10px", fontSize: 12.5, fontWeight: 600, color: T.gray900, cursor: "pointer", fontFamily: font }}
                  >
                    Add skip logic
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                    <div style={{ width: 96 }}>
                      <SelectField
                        label="If answer"
                        value={rule.op}
                        onChange={(v) => setRule({ op: v })}
                        options={[{ value: "eq", label: "is" }, { value: "lte", label: "at most" }, { value: "gte", label: "at least" }, { value: "includes", label: "includes" }]}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      {isMultipleChoice ? (
                        <SelectField label="Value" value={rule.value} onChange={(v) => setRule({ value: v })} options={[{ value: "", label: "Select..." }, ...(question.typeData.options ?? []).map((o) => ({ value: o, label: o }))]} />
                      ) : (
                        <TextField label="Value" value={rule.value} onChange={(v) => setRule({ value: v })} placeholder="e.g. 3" />
                      )}
                    </div>
                  </div>
                  <SelectField
                    label="Skip to"
                    value={rule.targetId}
                    onChange={(v) => setRule({ targetId: v })}
                    options={[{ value: "end", label: "End of survey" }, ...otherRows.map((r) => ({ value: r.question.id, label: `${r.pageName} · ${r.question.prompt || "Untitled question"}` }))]}
                  />
                  <button
                    onClick={() => onPatch({ skipRule: null })}
                    style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "transparent", cursor: "pointer", padding: "4px 0", fontSize: 12, fontWeight: 600, color: T.red, fontFamily: font, alignSelf: "flex-start" }}
                  >
                    <Trash2 size={12} /> Remove skip logic
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
}
