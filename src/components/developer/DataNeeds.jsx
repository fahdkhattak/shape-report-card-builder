import { createContext, useContext } from "react";
import { font } from "../../lib/tokens.js";
import { ds, dsText, dsSpace } from "../../lib/ds.js";
import { Section, Prose, CodeBlock } from "./docKit.jsx";
import { SimpleTable, List, Two, card_ } from "./docParts.jsx";
import { contractFor } from "./dataContract.js";

/* Lets any page link to another (the Data model page) without threading a prop through every page. */
export const DevNavContext = createContext({ openDoc: () => {} });
export const DocLink = ({ id, children }) => {
  const { openDoc } = useContext(DevNavContext);
  return <button type="button" onClick={() => openDoc(id)} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: font, font: "inherit", color: ds.text.link, textDecoration: "underline", textUnderlineOffset: 2 }}>{children}</button>;
};

const code = (s) => <code style={{ fontFamily: "ui-monospace, Menlo, monospace", ...dsText("Text 2xs"), color: ds.text.primary }}>{s}</code>;

/* "Data it needs": the backend contract for one Story or widget page (dataContract.js), in the generic vocabulary. */
export default function DataNeeds({ id, title = "Data it needs" }) {
  const c = contractFor(id);
  if (!c) return null;
  return (
    <Section id="data" title={title} lead={<>What the backend sends to draw this, written in the generic <DocLink id="data-model">data model</DocLink> so it fits any survey type. {c.lead}</>}>
      <SimpleTable head={["Input", "Shape", "Required", "Notes"]} widths={["18%", "34%", "14%", "34%"]} rows={c.needs.map(([a, b, r, n]) => [a, code(b), r, n])} />
      <CodeBlock label="Example response (JSON)" code={JSON.stringify(c.example, null, 2)} />
      <Two>
        <div style={card_}>
          <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Worked out in the component</span>
          {c.derived.length ? <List items={c.derived} /> : <span style={{ ...dsText("Text sm"), color: ds.text.secondary }}>Nothing: it draws what it's sent.</span>}
        </div>
        <div style={card_}>
          <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>Never sent to the client</span>
          <List items={["Individual answers or another person's record.", "A value for any group under the survey's minimum size.", "Hard-coded band lines or level names: they come with the survey."]} />
        </div>
      </Two>
      <div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}>
        <span style={{ ...dsText("Text sm", 600), color: ds.text.primary }}>When something's missing</span>
        <SimpleTable head={["Case", "What it does"]} widths={["32%", "68%"]} rows={c.missing} />
      </div>
      <Prose><p style={{ margin: 0, ...dsText("Text xs"), color: ds.text.tertiary }}>The shape the service sends; the component works out the rest itself.</p></Prose>
    </Section>
  );
}
