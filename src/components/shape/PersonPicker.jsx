import { T, font } from "../../lib/tokens.js";
import Dropdown from "../ui/Dropdown.jsx";
import { PEOPLE } from "../../lib/survey/surveyData.js";

/* Prototype control on the SHAPE Personal report: whose report this is. A real personal report is the signed-in
   person's own; with no accounts here, any of the dataset's 150 people can be picked. */
const OPTIONS = PEOPLE.map((p) => ({ value: p.id, label: `${p.profile.firstName} ${p.profile.lastName} · ${p.profile.jobTitle}` }));

export default function PersonPicker({ value, onChange }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: font }} title="Prototype: pick whose personal report to view">
      <span style={{ width: 1, height: 20, background: T.gray100 }} />
      <span style={{ fontSize: 12, color: T.gray500, whiteSpace: "nowrap" }}>Viewing as</span>
      <Dropdown value={value} onChange={onChange} options={OPTIONS} ariaLabel="Whose personal report" maxWidth={340} />
    </span>
  );
}
