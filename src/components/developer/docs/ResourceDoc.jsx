import { ResourceStory, SupportResourceStory } from "../../scope/stories/AddOnStories.jsx";
import { makeDoc, cardCheck, q, qa, rect, size, type, css, px } from "./storyDoc.jsx";
import { lightHexOf } from "../docKit.jsx";
import { T } from "../docParts.jsx";

const general = (p = {}) => <ResourceStory title="Explore Flow at Work Further" resource="How the Five Areas Shape Your Experience at Work" description="This white paper explains how the five Areas contribute to your result and offers practical ways to strengthen each one." {...p} />;
const support = (p = {}) => <SupportResourceStory {...p} />;

export const { meta, toc, Page } = makeDoc({
  id: "resource", name: "Resource", kind: "Resource",
  blurb: "A guide, paper, tool or service relevant to the insight, and the conditional support card that appears when a result calls for it.",
  source: "components/scope/stories/AddOnStories.jsx", figma: "13622:37386",
  purpose: {
    does: "provides a resource, service, support option, or external destination relevant to the selected insight.",
    contains: "articles, guides, white papers, tools, services, contact details, downloads, or external links.",
    boundary: "the resource must be available, verified, and relevant. Conditional support must follow its trigger, privacy, and safety rules.",
    extra: ["Two forms. The general resource is chosen by the creator for the insight. The support resource is conditional: it only appears when its trigger fires (for example a Mental Well-Being result in the severe range) and only with a verified service for the reader's organisation."],
    where: "the Time Impact and Work-life Scopes and the Widget Builder catalogue (general). Support is documented here; no Scope triggers it yet.",
  },
  forms: [
    { id: "form-general", name: "General resource", shows: "The resource's art, its name, what it is, and one CTA (Get White Paper).", when: "There's a guide, paper or tool worth reading for this insight.", render: () => general(), states: [{ title: "General resource · sample", render: () => general() }, { title: "General resource · a real link", note: "With `href` the button opens it in a new tab.", render: () => general({ href: "https://example.com", sample: false }) }] },
    { id: "form-support", name: "Support resource", shows: "The service's name, what it offers, a CTA to the service and its phone number.", when: "A result has crossed a support trigger and the organisation has a verified service.", render: () => support() },
  ],
  spec: [
    ["Card", "Shell", "The Story card: 808px, 18px radius, 16px padding, 16px gap. Title Text lg / Bold."],
    ["Side column", "Art", "124px wide, the 60px illustration 16px from its top, centred; 16px to the text. On a compact card the art sits above the text."],
    ["Text", "Title and body", <span key="t">Title Text sm / Bold {T("text/primary")}; body Text sm {T("text/secondary")}; 8px apart. Actions 16px under the text.</span>],
    ["General", "CTA", <span key="g">The extra-small dark pill: 24px, Text 2xs, 8px sides, {T("button/brand/primary/bg/default")}.</span>],
    ["Support", "CTAs", <span key="s">A 32px dark pill with a 16px chevron (16 + 2px sides), and a 32px outlined pill ({T("button/brand/secondary/border/default")}) with a 16px phone icon, 12px apart. The phone opens <code>tel:</code>.</span>],
  ],
  responsive: "Under 560px the art moves above the text and the buttons wrap.",
  content: [
    ["Titles", "“Explore [Insight] Further”, “Support Is Available”: title case, no full stop."],
    ["CTAs", "Say what you get: “Get White Paper”, “Go to EAP Service”. The phone button is the number itself."],
    ["Support copy", "Calm and specific: name the service, say it's confidential, one clear next step. Clinical wording needs specialist review."],
  ],
  a11y: [
    "The art is decorative (empty alt); everything it says is in the text.",
    "Buttons that open something are real links (new tab, rel=noreferrer); the phone button is a tel: link so a phone can call it.",
    "Inert buttons in the prototype say so on hover.",
  ],
  props: [
    { name: "ResourceStory.title / resource / description", type: "string", required: true, desc: "Story title, the resource's name, and what it is." },
    { name: "ResourceStory.linkLabel / href", type: "string", def: "\"Get White Paper\"", desc: "The CTA, and where it goes. Without `href` the button is inert." },
    { name: "SupportResourceStory.service", type: "{ name, description, ctaLabel, href, phone }", desc: "The verified service. Only render the Story when its trigger has fired." },
    { name: "sample", type: "boolean", def: "true", desc: "Shows the “Sample” tag while the copy isn't real." },
  ],
  usage: `<ResourceStory title="Explore Flow at Work Further" resource="How the Five Areas Shape…" description="…" href={url} />\n{triggered && <SupportResourceStory service={orgEap} />}`,
  done: ["The art column is 124px, the art 60px, 16px from the top.", "Title bold, body secondary, 8px apart; CTAs 16px under.", "Support only renders when its trigger fires and a verified service exists.", "Links open in a new tab; the phone is tel:.", "Stacks on a compact card."],
  parity: [
    { title: "General resource (13622:37387)", render: () => general({ sample: false }), checks: [
      ...cardCheck("13622:37387", "808 × 186"),
      { part: "Art column width · art size", node: "13622:37392", figma: "124 · 60", read: (r) => `${Math.round(rect(q(r, '[data-part="art-column"]')).width)} · ${Math.round(rect(q(r, '[data-part="art-column"] img')).width)}` },
      { part: "Resource title: type · colour", node: "13622:37399", figma: "14/20 · 700 · #1d1a1b", read: (r) => { const t = q(r, '[data-part="resource-title"]'); return `${type(t)} · ${lightHexOf(t, ["color"])}`; } },
      { part: "Body: type · colour", node: "13622:37400", figma: "14/20 · 400 · #504c4d", read: (r) => { const t = q(r, '[data-part="resource-body"]'); return `${type(t)} · ${lightHexOf(t, ["color"])}`; } },
      { part: "CTA: height · fill · type", node: "13622:37401", figma: "24 · #231f20 · 12/16 · 400", read: (r) => { const b = q(r, '[data-part="story-button"]'); return `${Math.round(rect(b).height)} · ${lightHexOf(b, ["background"])} · ${type(b)}`; } },
    ] },
    { title: "Support resource (13622:37402)", render: () => support({ sample: false }), checks: [
      ...cardCheck("13622:37402", "808 × 234"),
      { part: "Primary CTA: height · fill", node: "13622:37416", figma: "32 · #231f20", read: (r) => { const b = q(r, '[data-part="story-button"]'); return `${Math.round(rect(b).height)} · ${lightHexOf(b, ["background"])}`; } },
      { part: "Phone CTA: height · border", node: "13622:37417", figma: "32 · 1 #231f20", read: (r) => { const b = qa(r, '[data-part="story-button"]')[1]; return `${Math.round(rect(b).height)} · ${px(css(b).borderTopWidth)} ${lightHexOf(b, ["border"])}`; } },
    ] },
  ],
  owner: [
    "Decisions for you. (1) What triggers the support card (which result, which threshold) and who verifies the service: neither is designed. (2) The bracketed copy in the frames ([Flow at Work], [BetterHelp]) is filled per organisation; the source of that data isn't defined. (3) The support copy makes health claims (“immediate help”) that need clinical and legal review. (4) No resource library exists; the general card's art is the SHAPE mark from the frame.",
  ],
  researcher: {
    lead: "The result is the start, not the end.",
    story: ["A Resource doesn't add data. It connects a result to something that helps a reader understand or act on it: a paper explaining the measure, or a service when a result suggests someone may need support."],
    idea: "Every result should have somewhere to go next; some results should have someone to talk to.",
    facts: [["Question it answers", "Where can I learn more?"], ["Data used", "None", "Except the trigger for the support form."], ["Forms", "Two", "General and support."]],
    feeds: [["The resource", "Chosen by the creator for the insight."], ["The support service", "The organisation's verified provider (EAP)."], ["The trigger", "A result crossing a defined threshold (not yet defined)."]],
    limits: [["A link isn't evidence.", "A resource's claims are its own; it isn't part of the SHAPE result."], ["Triggers can miss people.", "A threshold shows support to some who need it, not all; it must never be the only route to help."]],
    answers: ["Where can I read more?", "Who can I talk to?"],
    nonAnswers: ["What does my score mean? (Meaning)", "What should I do? (Actions)"],
    open: [["Trigger rules", "Which results show the support card, and is it shown to the reader only or to their manager too?"], ["Verification", "Who checks that a service is real and current?"]],
  },
});
export default Page;
