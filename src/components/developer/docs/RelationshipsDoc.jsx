import { QuadrantStory, WithWithoutStory, StatusOutcomeStory } from "../../scope/stories/InsightStories.jsx";
import { PAIRS, quadrant, withWithout, outcomeByStatus } from "../../../lib/survey/insightData.js";
import { makeDoc } from "./storyDoc.jsx";
import { T, tok } from "../docParts.jsx";

/* Live examples from the 150-person SHAPE survey dataset. */
const LABEL = { stress: "Stress", resilience: "Resilience", workload: "Workload", balance: "Balance", engagement: "Engagement", commitment: "Commitment" };
const pairs = () => PAIRS.map((p) => ({ ...quadrant(p.key), label: `${LABEL[p.x]} and ${LABEL[p.y]}` }));
const Difference = () => <WithWithoutStory data={withWithout()} />;
const quad = (p = {}) => <QuadrantStory pairs={pairs()} {...p} />;
const status = (form = "waffle") => <StatusOutcomeStory {...outcomeByStatus()} form={form} />;

export const { meta, toc, Page } = makeDoc({
  id: "relationships", name: "Relationships", kind: "Diagnostic",
  blurb: "Three Stories about how one thing goes with another: where people sit on two measures, how much more likely an outcome is with something than without it, and what each status goes with. From the SHAPE report samples; not in Figma yet.",
  source: "components/scope/stories/InsightStories.jsx · lib/survey/insightData.js", figma: "",
  purpose: {
    does: "shows a link between two things in the survey, in a form a reader can act on: a zone people sit in, a difference something makes, or what a status goes with.",
    contains: "Where People Sit (four zones from two measures, a dropdown to pick the pair), What Makes the Difference (a card per offer: with and without circles and a p-value) and Why Flourishing Matters (an outcome per status, as a 100-square waffle or ten figures). Each has Table View and Copy Table.",
    boundary: "describes links, never causes. Every card says so. Groups under 5 people show no share and no test.",
    extra: ["All three read the new 150-person SHAPE survey dataset, so they live in the SHAPE report's Org Scopes and not yet in the Widget Builder (which still reads the old dataset)."],
    where: "SHAPE › Org: Org Score (What Makes the Difference), Org Status (Why Flourishing Matters), Mental Well-being (Where People Sit).",
  },
  forms: [
    {
      id: "form-quadrant", name: "Where People Sit", shows: "Two forms. Scatter (default): every person a dot placed by their two scores, the zones cut at the Striving line and drawn to scale. Zones: four equal quarters, each holding its people as one cluster of dots, so the cluster's size is the headcount. A chip in each zone's corner gives its share and name; hover or tap a zone to read it.", when: "Two measures that are worth reading together (stress and resilience, workload and balance, engagement and commitment).", render: () => quad(),
      states: [
        { title: "Stress and Resilience (default)", note: "Each axis runs bad to good, so the top-right zone is always the good one: green when both are good, red when both are bad, amber when they disagree.", render: () => quad() },
        { title: "Zones", note: "Equal quarters; each dot is a person but not placed by score. Needs only the four counts.", render: () => quad({ form: "zones" }) },
        { title: "One pair only", note: "No dropdown.", render: () => quad({ pairs: [pairs()[1]] }) },
      ],
    },
    {
      id: "form-difference", name: "What Makes the Difference", shows: "A card per thing people have or don't: two circles (with it, without it, areas to scale across the Story) and the p-value under them. Hover or tap a card and the line underneath says it in a sentence (“People with work flexible enough for their needs are more likely to be Flourishing: 29% against 0% without it.”) with the counts.", when: "Pointing at a concrete thing an organisation can provide (a quiet workspace, up-to-date software) and showing it goes with better outcomes.", render: () => <Difference />,
      states: [
        { title: "Default", render: () => <Difference /> },
      ],
    },
    {
      id: "form-status-outcome", name: "Why Flourishing Matters", shows: "Two forms. Waffle (default): one column per band side by side, a share as 100 squares, a score as the square filled to its level. People: one row per band, a share as ten figures, a score as a bar.", when: "Making the case that the band is worth moving: what people in the best band say and do that people in the lowest don't. Any survey that bands its score, or any ordered segmentation.", render: () => status(),
      states: [
        { title: "Waffle (default)", render: () => status() },
        { title: "People", note: "The earlier pictogram, kept as a second form.", render: () => status("people") },
      ],
    },
  ],
  spec: [
    ["Card", "Shell", "The Story card; title Text lg / Bold, explanatory line, controls (tabs, Chart / Table, Copy Table), then the Evidence Section."],
    ["Quadrant plot", "Square", <span key="z">A square 0 to 100 plot, 500px wide (full width on a compact card), radius/lg. The four zones are cut at the Striving line, so they're drawn to scale (the good corner is 40 × 40, not a quarter). Tints {T("status/success/bg")}, {T("status/warning/bg")} and {T("status/error/bg")} by zone, never by the number; the hovered or picked zone gets a 2px inset ring in its graph colour (not bg-strong, which is the full status colour in Light and would hide the dots). Cut lines 1px dashed {T("border/strong")}.</span>],
    ["People", "Dots", <span key="p">One dot per person in the zone's status graph colour at 95%, a hairline {T("surface/General/card")} edge. People with the same two scores are packed in a small sunflower cluster around that point, kept on their own side of the cut. Dots outside the active zone fade to 15%. Switching pairs glides every dot to its new place (520ms).</span>],
    ["Zone label", "Chip", <span key="d">In the zone's outer corner: a {T("surface/General/card")} chip, radius/md, shadow xs. Share 20px / 700 (16 compact), tabular, in the zone's text-indicator colour (amber uses text-strong); name Text 2xs / 500 {T("text/secondary")}.</span>],
    ["Axes", "Text", <span key="a">Ticks 0, cut, 100 in Text 3xs {T("text/quaternary")}; measure name Text 2xs / 700 {T("text/secondary")}, its two ends Text 3xs {T("text/tertiary")} (bad end left and bottom). The y title is rotated.</span>],
    ["Offer cards", "Grid", <span key="o">3 columns (2 under 560px), 12px apart; each card a button, radius/lg, hover or pick tints {T("interactive/ghost-hover")}. The offer name Text xs / 500 {T("text/secondary")}, balanced over two lines.</span>],
    ["Circles", "SVG", <span key="c">With and Without side by side on a {T("border/tertiary")} baseline, in the offer's graph colour ({tok("utility/Graph Colors/Main/Mint Green")} and the next five), With solid, Without at 35%. Radius is the square root of the share against the largest share in the Story (46px; 34 compact, 26 under 400px), so every area compares. The share inside a circle of 20px or more (16 / 700, {T("text/alwaysblack")} on the solid colour), above it otherwise. 0% and too-few are a dashed {T("border/secondary")} ring.</span>],
    ["p-value", "Text", "Under the circles: “p = 0.005” (three places under 0.1, “p < 0.001” below that, “Too few to test” when a group is under 5), Text 2xs tabular; text/secondary / 500 when p < 0.05, text/quaternary otherwise. Nothing else on the card."],
    ["Hover line", "Text", "Under the cards. Hover or tap a card: the card as one sentence in text/primary (more / less / as likely, with both shares), then the counts and p in text/tertiary. At rest: “Hover or tap a card to read it.”"],
    ["Zones form", "Clusters", "Where People Sit, form=\"zones\": four equal quarters, no ticks or cut lines. Each zone's people as one sunflower cluster near the middle of its quarter; dot spacing is set by the largest zone, so every dot is the same size and a cluster's size is its headcount."],
    ["People form", "Icons", <span key="pp">One row per band: the number 28px / 700 and the band name in its text-indicator colour (180px column), then ten lucide User figures 30px (22 compact), empty in {T("border/secondary")}, filled in the band's graph colour and clipped for a part. A score is an 8px bar.</span>],
    ["Waffles", "Grid", <span key="w">One column per status, up to 600px wide in all. 10 × 10 squares, 2px gaps (1.5 compact), radius 2; filled from the bottom row up in the status graph colour, the rest {T("interactive/ghost-hover")}. Switching outcome refills them with a 4ms-per-square ripple. A score fills the same square to its level, with quarter lines.</span>],
    ["Status number", "Text", "32px / 700 (24 compact), tabular, text/primary, the % in 500 text/tertiary; the caption Text 2xs text/tertiary. Status name Text sm / 700 in its text-indicator colour, headcount Text 3xs."],
  ],
  responsive: "Under 560px: the zone grid fills the card and the discs shrink; the offer grid drops from three columns to two, with smaller circles (34px, then 26px under 400px); the status rows stack the number above the people.",
  content: [
    ["Links, not causes", "Every card ends its note with “A link, not proof that one causes the other.”"],
    ["Evidence words", "p under 0.01: “Strong evidence”; under 0.05: “Some evidence”; otherwise “Could be chance”. The p-value is shown too, for the reader who wants it."],
    ["Small groups", "“Too few people without it to show”, never a share from fewer than 5 people."],
    ["Zone names", "Two words at most (Steady, Coping, Untested, At risk). The meaning goes in the detail line, one sentence, full stop."],
  ],
  a11y: [
    "Zones are buttons with aria-pressed; their name gives the share, the headcount and the meaning, so the plot reads without the colour or the dots.",
    "Each with / without row is a button whose label gives both shares and the test; each waffle is an image with its share in words.",
    "The zone detail line is a status region, so a screen reader hears the selection.",
  ],
  props: [
    { name: "QuadrantStory · pairs", type: "Pair[]", required: true, desc: "From quadrant(pairKey). The first is shown first; more than one adds a dropdown (never tabs: a survey can offer many). One pair hides it." },
    { name: "WithWithoutStory · data", type: "{ outcome: { label, phrase }, n, items }", required: true, desc: "From withWithout(). The outcome's phrase completes the hover sentence (“…more likely to be Flourishing”)." },
    { name: "QuadrantStory · form", type: "\"scatter\" | \"zones\"", def: "\"scatter\"", desc: "Scatter needs each person's two scores; zones needs only the four counts." },
    { name: "StatusOutcomeStory · groups (or statuses), outcomes", type: "list · list", required: true, desc: "Best group first. Each group: status (its label), n, values, and tone (success · warning · error · neutral; SHAPE's names map by themselves). From outcomeByStatus() for SHAPE." },
    { name: "StatusOutcomeStory · form", type: "\"waffle\" | \"people\"", def: "\"waffle\"", desc: "Squares in columns, or figures in rows." },
    { name: "QuadrantStory · pair.scale, cells[].name", type: "[min, max] · string", def: "[0, 100] · plain words", desc: "Any survey's range; zone names are optional (“High pay, low growth”)." },
    { name: "title, line", type: "string", desc: "Override the default title and the sentence worked out from the data." },
  ],
  usage: `<QuadrantStory pairs={PAIRS.map((p) => ({ ...quadrant(p.key), label: "Stress and Resilience" }))} />
<WithWithoutStory data={withWithout()} />
<StatusOutcomeStory {...outcomeByStatus()} />`,
  done: [
    "The four zones always add up to the people counted (rounding aside), and the top-right zone is the good one for every pair.",
    "No share or test is shown for a group under 5 people.",
    "Every with / without row uses the same scale, and the accent appears only when p < 0.05.",
    "Every card says it shows a link, not a cause.",
    "No sideways scroll at 320, 390 and 808px.",
  ],
  owner: [
    "Not designed in Figma; built from the SHAPE report samples the product owner shared (stress against resilience, the with / without circles, the outcome by status pictogram). Questions for design: (1) Are the zone names (Steady, Coping, Untested, At risk) right, and should each pair have its own? (2) The samples drew nested circles and ten person icons; built as a dumbbell row per offer and 100-square waffles instead, so every offer and every status compares on one scale. Keep? (3) The sample shows an intent-to-leave outcome; the survey doesn't ask it, so it isn't shown. Should a question be added? (4) Is “Could be chance” the right plain-words reading of a p-value of 0.05 or more?",
  ],
  researcher: {
    lead: "Three honest ways of saying one thing goes with another.",
    story: [
      "Where People Sit cuts two measures at the Striving line (60) and counts people in each of the four zones. It shows the mix, not an average: an organisation can score fine on stress and on resilience and still have a quarter of its people at risk on both.",
      "What Makes the Difference takes one question at a time, splits people into those who agree (have it) and those who disagree (don't), leaves out Neutral, and compares how many in each group reach an outcome. Fisher's exact test says how likely a gap that size would be if having it made no difference; it stays honest on the small groups a 150-person survey gives.",
      "Why Flourishing Matters groups people by overall status and shows an outcome for each: how many look forward to work, and how they rate their own performance.",
    ],
    idea: "Show the link in a form people can act on, and never claim it's a cause.",
    facts: [["Question it answers", "What goes with what?"], ["Data used", "The latest round's scored answers, per person"], ["Test", "Fisher's exact, two-sided"], ["Status", "Proposal", "From the SHAPE report samples, not Figma."]],
    feeds: [
      ["Resilience", "Mean of PSY3.1 to PSY3.3 (adapt, bounce back, hold up under pressure). Shown on its own, not part of the SHAPE score."],
      ["Stress", "The Stress Driver, 100 = never stressed."],
      ["With / without", "Agree or Strongly agree (75+) against Disagree or Strongly disagree (25 or less) on SoftWE1.2, SoftWE1.4, PhysWE1.5, SoftWE1.1, EE1.4 and EC2."],
      ["Outcomes", "Flourishing = overall status; Look forward to work = agree on EC1.6; Performance = HPQ absolute (0 to 100)."],
    ],
    limits: [
      ["A link, not a cause.", "People who flourish may also report better workspaces because they feel better, not the other way round."],
      ["Small groups.", "With 150 people, “without” groups are often under 10. The test accounts for that, but a large gap can still read as “could be chance”."],
      ["Status is built from these answers.", "Flourishing is the overall score, which includes many of the same questions, so some of the link is built in."],
      ["Cut points are fixed.", "The zones split at 60. A person at 59 and one at 61 land in different zones."],
      ["No intent to leave.", "The survey doesn't ask it, so the sample's “likely to leave” outcome isn't shown."],
    ],
    answers: ["How many of our people are under stress with little to fall back on?", "Does a quiet workspace go with flourishing here?", "What does Flourishing look like in outcomes we care about?"],
    nonAnswers: ["Would giving people a quiet workspace make them flourish? (A link, not a cause.)", "Who exactly is at risk? (Counts only, no names.)"],
    open: [["Outcome list", "Which outcomes matter most to clients: look forward, performance, or a new intent-to-leave question?"], ["Per pair names", "Should each quadrant pair have its own zone names, written by a researcher?"]],
  },
});
export default Page;
