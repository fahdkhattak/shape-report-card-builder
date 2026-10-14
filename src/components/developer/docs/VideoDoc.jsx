import { VideoStory } from "../../scope/stories/AddOnStories.jsx";
import { makeDoc } from "./storyDoc.jsx";
import { T } from "../docParts.jsx";

const TRANSCRIPT = "Your score runs from 0 to 100. It's the average of the Explorers behind it, and each Explorer is the average of its Drivers. A score of 80 or more is Flourishing, 60 to 79 is Striving, and under 60 is Struggling.";
const V = (p = {}) => () => <VideoStory line="A two-minute walk through what your score is made of." caption="Recorded by the SHAPE research team." transcript={TRANSCRIPT} {...p} />;

export const { meta, toc, Page } = makeDoc({
  id: "video", name: "Video", kind: "Video",
  blurb: "An explanatory video with its transcript. Not designed in Figma yet: built from the system's parts and offered for design review.",
  source: "components/scope/stories/AddOnStories.jsx (VideoStory)", figma: "",
  purpose: {
    does: "explains an insight, a measure or a next step in a short video.",
    contains: "a poster, the duration, a caption, and the transcript.",
    boundary: "a video explains; it never replaces the result or the Methodology, and it always has a transcript.",
    extra: ["There's no Figma frame for this family; the Stories board lists it but draws nothing. It's built from the same parts as the rest (Story card, radius/lg media, the dark pill language) so it sits in a Scope without looking foreign. Treat it as a proposal."],
    where: "nowhere yet. The catalogue keeps it blocked until there's a real video to show.",
  },
  forms: [{ id: "form-video", name: "Video", shows: "A 16:9 poster with a centred play button and the duration, a caption, and a collapsible transcript.", when: "A concept is easier shown than read.", render: V() }],
  spec: [
    ["Card", "Shell", "The Story card: title, explanatory line, then the media."],
    ["Media", "Frame", <span key="m">16:9, radius/lg, {T("bg/inverse")} until the poster loads. Play: a 56px white circle with a 22px play icon, centred. Duration: a pill bottom-right, 12px in, white text on 60% black.</span>],
    ["Caption", "Text", "Text sm text/secondary."],
    ["Transcript", "Disclosure", "A hairline, then “Transcript” (Text sm / Bold) with a chevron; open, the transcript in Text sm."],
  ],
  responsive: "The frame keeps 16:9 at any width; the play button and duration stay the same size.",
  content: [["Title", "“Watch: …”, title case."], ["Transcript", "Always present. Verbatim, not a summary."], ["Duration", "m:ss, from the file."]],
  a11y: ["Every video has a transcript.", "The play button names the video it plays; without a file it says there's no video.", "Uses the browser's own video controls (keyboard, captions) once playing."],
  props: [
    { name: "title / line / caption", type: "string", desc: "Story title, explanatory line, caption." },
    { name: "src / poster / duration", type: "url / url / string", desc: "The file, its poster, its length. Without `src` the poster is inert." },
    { name: "transcript", type: "string", desc: "The transcript (required to ship)." },
  ],
  usage: `<VideoStory title="Watch: What Your Score Means" src={url} poster={img} duration="2:30" transcript={text} />`,
  done: ["16:9 media with a centred play button and the duration.", "A transcript is always available.", "Plays with native controls."],
  owner: ["Not designed. Questions for design: (1) Is this the right shape (poster, play, transcript), or should it be a smaller row (thumbnail + title)? (2) Where are videos hosted, and who makes them? (3) Should playing open a modal rather than play in the card?"],
  researcher: {
    lead: "Some explanations land better seen than read.",
    story: ["A Video Story carries no data. It's an explanation, so its value depends entirely on the video; the transcript makes it accessible and searchable."],
    idea: "Show, don't tell, but always offer the words too.",
    facts: [["Question it answers", "Can someone explain it?"], ["Data used", "None"], ["Status", "Proposal", "Not in Figma."]],
    feeds: [["The video", "Produced content (none in this prototype)."]],
    limits: [["Not everyone can watch.", "Hence the transcript, always."]],
    answers: ["Can someone walk me through this?"],
    nonAnswers: ["What's my result?"],
    open: [["Hosting and production", "Who makes and hosts the videos?"]],
  },
});
export default Page;
