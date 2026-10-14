import { subjectFromPrompt } from "../../lib/scopeSubject.js";
import { storyById } from "./storyCatalog.jsx";

/* A built widget's Scope, as the Scope pane shows it once the widget is on a
   report: its saved Stories, in order, each reading real data for what the
   widget is about. (`scope` = { prompt, stories: string[] } from the Widget
   Builder.) */
export default function BuiltScope({ scope }) {
  const subject = subjectFromPrompt(scope.prompt);
  if (!subject) return null;
  return (
    <>
      {scope.stories.map((id) => {
        const def = storyById(id);
        const el = def?.render(subject, { stories: scope.stories });
        return el ? <div key={id} style={{ display: "contents" }}>{el}</div> : null;
      })}
    </>
  );
}
