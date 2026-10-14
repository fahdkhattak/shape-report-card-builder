import { T, font } from "../../../lib/tokens.js";

/* ================================================================== */
/* TOGGLE BOARD — a rating matrix (corrected from the user's reference    */
/* screenshot: rows of sub-items, each rated with a single radio across    */
/* a shared column scale — NOT literal on/off toggles despite the name).   */
/* Own file per the approved plan §2a, since this type's shape was          */
/* provisional pending that reference image and may need further            */
/* revision in isolation from the other question types.                     */
/*                                                                          */
/* `value` is `{ [row]: columnIndex }`.                                     */
/* ================================================================== */
export default function ToggleBoardRespond({ typeData, value, onChange }) {
  const answers = value ?? {};
  const setAnswer = (row, colIndex) => onChange({ ...answers, [row]: colIndex });

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontFamily: font }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }} />
            {typeData.columns.map((col) => (
              <th key={col} style={{ fontSize: 10.5, fontWeight: 500, color: T.gray500, padding: "0 6px 8px", textAlign: "center", whiteSpace: "nowrap" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {typeData.rows.map((row) => (
            <tr key={row} style={{ borderTop: `1px solid ${T.gray75}` }}>
              <td style={{ fontSize: 13, fontWeight: 600, color: T.gray900, padding: "10px 10px 10px 0", whiteSpace: "nowrap" }}>{row}</td>
              {typeData.columns.map((col, i) => (
                <td key={col} style={{ textAlign: "center", padding: "10px 6px" }}>
                  <button
                    onClick={() => setAnswer(row, i)}
                    style={{ width: 18, height: 18, borderRadius: 9999, border: `1.5px solid ${answers[row] === i ? T.gray800 : T.gray300}`, background: answers[row] === i ? T.gray800 : "transparent", cursor: "pointer", padding: 0 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
