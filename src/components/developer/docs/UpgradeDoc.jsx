import { UpgradePathStory } from "../../scope/stories/AddOnStories.jsx";
import { makeDoc, cardCheck, q, qa, rect, type, css, px } from "./storyDoc.jsx";
import { lightHexOf } from "../docKit.jsx";
import { T } from "../docParts.jsx";

const U = (p = {}) => () => <UpgradePathStory {...p} />;

export const { meta, toc, Page } = makeDoc({
  id: "upgrade", name: "Upgrade Path", kind: "Upgrade Path",
  blurb: "An additional product, report, feature or service relevant to the insight, kept visually apart from the result.",
  source: "components/scope/stories/AddOnStories.jsx", figma: "13622:37468",
  purpose: {
    does: "presents an additional product, report, feature, or service that is relevant to the selected insight.",
    contains: "a product summary, its connection to the current insight, a preview, the provider, price information, and one appropriate CTA.",
    boundary: "it must remain visually separate from the result and guidance. It's only shown when the offer is available, relevant, and not already owned.",
    extra: [
      "Placement (from the board): the creator can add it to any Scope where the offered product is relevant, and picks which product it promotes. It must explain the connection between the insight and the product, ideally after the result, explanation and diagnostics. It should not look like part of the user's result or guidance.",
      "It appears only to users who don't own the product, and is hidden if the product is unavailable, unpublished, or no longer for sale. If the user can't make purchases, the CTA changes to Ask Your Admin or Contact Creator.",
    ],
    where: "the Org Score Scope and the Widget Builder catalogue.",
  },
  forms: [
    { id: "form-offer", name: "Offer", shows: "Header with product and premium icons, a preview tile, the product name, the connection, and the CTAs.", when: "The reader can buy the product.", render: U(), states: [{ title: "Reader can buy", render: U() }, { title: "Reader can't buy", note: "Only Contact Creator (or Ask Your Admin) is offered.", render: U({ canBuy: false }) }] },
  ],
  spec: [
    ["Card", "Shell", "The Story card: 808px, 18px radius, 16px padding. Title “Available to Add”, Text lg / Bold, with two 24px icons at the right, 8px apart: a report icon (text/tertiary) and the premium crown (#FEAB25)."],
    ["Preview tile", "Surface", <span key="t">124px wide, as tall as the text, {T("bg/primary")}, radius/lg. Holds the product's preview image when there is one. 16px to the text.</span>],
    ["Text", "Name and connection", <span key="x">Name Text sm / Bold {T("text/primary")}; connection Text sm {T("text/tertiary")}; 8px apart.</span>],
    ["CTAs", "Buttons", <span key="b">36px dark pills (Text sm, 16 + 2px sides, {T("button/brand/primary/bg/default")}), 12px apart, 16px under the text.</span>],
  ],
  responsive: "Under 560px the preview becomes a 96px band above the text and the buttons wrap.",
  content: [
    ["Name", "What the reader gets, not the SKU: “See the Wider Team Picture”."],
    ["Connection", "Always says how the product relates to this insight: “compare results across your team”."],
    ["CTA", "“Get Team Analytics” to buy; “Contact Creator” or “Ask Your Admin” when the reader can't."],
    ["Separation", "Never styled like a result: no scores, no status colours."],
  ],
  a11y: ["The header icons are decorative (the title says what the card is).", "Every CTA is a button with its action as text."],
  props: [
    { name: "title / description", type: "string", required: true, desc: "Product name and its connection to the insight." },
    { name: "cta / altCta", type: "string", def: "\"Get Team Analytics\" / \"Contact Creator\"", desc: "Buy, and the fallback when the reader can't buy." },
    { name: "canBuy", type: "boolean", def: "true", desc: "False shows only the fallback CTA." },
    { name: "preview", type: "url", desc: "An image for the preview tile." },
    { name: "sample", type: "boolean", def: "true", desc: "The Sample offer tag." },
  ],
  usage: `{!owned && available && <UpgradePathStory title="See the Wider Team Picture" description="…" canBuy={user.canPurchase} />}`,
  usageNote: "Ownership, availability and purchasing rights aren't modelled in this prototype; the caller decides whether to render it.",
  done: ["Only rendered for products the reader doesn't own and that are for sale.", "Explains the connection to this insight.", "Visually apart from the result: no scores, no status colours.", "CTA switches when the reader can't buy."],
  parity: [
    { title: "Upgrade Path (13622:37469)", render: U({ sample: false }), checks: [
      ...cardCheck("13622:37469", "808 × 198"),
      { part: "Header icons: size", node: "13622:37473", figma: "24 · 24", read: (r) => qa(r, '[data-part="upgrade-icon"]').map((i) => Math.round(rect(i).width)).join(" · ") },
      { part: "Preview tile: width · fill · radius", node: "13622:37479", figma: "124 · #f2f2f2 · 12", read: (r) => { const t = q(r, '[data-part="preview-tile"]'); return `${Math.round(rect(t).width)} · ${lightHexOf(t, ["background"])} · ${px(css(t).borderTopLeftRadius)}`; } },
      { part: "Connection text: colour", node: "13622:37487", figma: "#7c7879", read: (r) => lightHexOf(q(r, '[data-part="resource-body"]'), ["color"]) },
      { part: "CTA: height · type", node: "13622:37489", figma: "36 · 14/20 · 400", read: (r) => { const b = q(r, '[data-part="story-button"]'); return `${Math.round(rect(b).height)} · ${type(b)}`; } },
    ] },
  ],
  owner: [
    "Decisions for you. (1) Both CTAs in the frame are dark primary; the placement rules say one CTA. Built as one primary when the reader can buy, plus the fallback; when they can't, only the fallback. (2) Price and provider are in “Can contain” but not drawn. (3) The preview tile is empty in the frame. (4) Ownership and purchasing rights aren't modelled; the caller decides.",
  ],
  researcher: {
    lead: "An offer, not a finding.",
    story: ["Upgrade Path is the only Story that sells. It sits apart from the result so nobody mistakes an offer for evidence, and only appears where the product genuinely extends what the reader is looking at."],
    idea: "If it would help with this insight and you don't have it, here's how to get it.",
    facts: [["Question it answers", "What's next?"], ["Data used", "None"], ["Shown to", "Non-owners only"]],
    feeds: [["The product", "Chosen by the creator."], ["Ownership and price", "The product catalogue (not in this prototype)."]],
    limits: [["It's commercial.", "Readers should be able to tell it apart from their result at a glance."], ["Relevance is a judgement.", "The creator decides it's relevant; nothing checks."]],
    answers: ["What else could help with this?"],
    nonAnswers: ["What does my result mean?", "What should I do? (Actions)"],
    open: [["How often can it appear?", "One per Scope, or one per report?"], ["Price display", "Show price on the card, or after the CTA?"]],
  },
});
export default Page;
