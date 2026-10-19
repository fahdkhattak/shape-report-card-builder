import { ds } from "./ds.js";

/* ================================================================== */
/* RESPONSE ANALYSIS — SAMPLE DATA (Figma 15299:45659).                  */
/* The generated dataset has scores only: the survey's open-text         */
/* questions were never modelled, so there are no real verbatims,        */
/* themes or summaries. Everything here is sample content written for    */
/* the prototype, and the screens that use it say so. It is one          */
/* consistent set: each question's theme counts add up to its responses, */
/* the Response Map and the Popular Responses widget read the same       */
/* themes, and the verbatims are tagged with the question and theme they  */
/* belong to. Swap this file for the real feed and nothing else changes.  */
/* ================================================================== */
export const SAMPLE_RESPONDENTS = 92;

/* Themes, with the graph colour each keeps everywhere it appears. */
export const THEMES = [
  { id: "workload", label: "Workload and Time Management", color: ds.graph.personalBlue, about: "too much to do in the time given, deadlines stacking up, and little room to plan" },
  { id: "health", label: "Health and Wellness", color: ds.graph.lavenderViolet, about: "sleep, energy, physical health and looking after themselves outside work" },
  { id: "environment", label: "Workplace Environment", color: ds.graph.amberOrange, about: "noise, space, temperature and the comfort of where they work" },
  { id: "stress", label: "Job Stress and Burnout", color: ds.graph.mintGreen, about: "feeling stretched, tired and close to their limit" },
  { id: "learning", label: "Learning and Growth", color: ds.graph.goldenYellow, about: "training, study commitments and wanting a clearer path to grow" },
  { id: "recognition", label: "Lack of Support and Recognition", color: ds.graph.coralRed, about: "wanting their effort noticed and more backing from leaders" },
  { id: "tools", label: "Tools and Systems", color: ds.graph.teal, about: "slow or clunky systems and too many forms for simple tasks" },
  { id: "family", label: "Family and Caring", color: ds.graph.hotPink, about: "caring for children or relatives alongside work" },
  { id: "finance", label: "Financial Pressure", color: ds.graph.oliveGreen, about: "living costs and money worries that follow them to work" },
  { id: "communication", label: "Communication", color: ds.graph.orangeCoral, about: "hearing about changes late, or not at all" },
  { id: "flexibility", label: "Flexibility", color: ds.graph.cyanGlow, about: "wanting more say over when and where they work" },
  { id: "manager", label: "Manager Check-ins", color: ds.graph.limeGreen, about: "wanting more regular, useful time with their manager" },
];
export const themeById = (id) => THEMES.find((t) => t.id === id);

/* The open-text questions, each tied to the Explorer it sits under, with how many people answered it and how those answers
   split across themes. */
export const QUESTIONS = [
  { id: "q1", explorer: "Psychological Health", text: "Are there any other sources of stress not mentioned here that affect you?", themes: { workload: 20, finance: 14, stress: 12, family: 11, health: 9, recognition: 7 } },
  { id: "q2", explorer: "Life Outside Work", text: "Are there any other activities that strain your capacity to maintain good work-life balance?", themes: { family: 13, learning: 11, health: 9, flexibility: 7, workload: 4 } },
  { id: "q3", explorer: "Manager Style", text: "Is there anything you would like to change in your relationship with your manager which could help you improve your performance?", themes: { manager: 16, recognition: 12, communication: 9, workload: 6 } },
  { id: "q4", explorer: "Corporate Culture", text: "What's one thing you would change about the company culture if you could?", themes: { recognition: 18, communication: 17, flexibility: 13, stress: 11, learning: 9, tools: 8 } },
  { id: "q5", explorer: "Physical Work Environment", text: "Apart from the items above, what else do you feel could be done to improve your physical work environment?", themes: { environment: 21, health: 7, tools: 5 } },
  { id: "q6", explorer: "Soft Work Environment", text: "Is there anything about the tools and systems you use that gets in the way of your work?", themes: { tools: 19, workload: 8, communication: 5 } },
].map((q) => ({ ...q, responses: Object.values(q.themes).reduce((a, b) => a + b, 0) }));

/* Theme totals for a set of questions, largest first. */
export function themeTotals(questionIds = QUESTIONS.map((q) => q.id)) {
  const sum = {};
  QUESTIONS.filter((q) => questionIds.includes(q.id)).forEach((q) => Object.entries(q.themes).forEach(([t, n]) => { sum[t] = (sum[t] || 0) + n; }));
  return Object.entries(sum).map(([id, value]) => ({ ...themeById(id), value })).sort((a, b) => b.value - a.value);
}

/* Sample verbatims: [question id, theme id, text]. Written for the prototype; no real person said these. */
export const VERBATIMS = [
  ["q1", "workload", "Deadlines keep landing on top of each other and there's never a quiet week to catch up."],
  ["q1", "workload", "I spend most evenings finishing what I couldn't get to during the day."],
  ["q1", "finance", "Rent has gone up twice this year and it's hard not to think about that at work."],
  ["q1", "finance", "Money worries are the main thing keeping me up at night right now."],
  ["q1", "stress", "Some weeks I feel like I'm running on empty by Wednesday."],
  ["q1", "family", "Looking after my mum means I'm often on the phone between meetings."],
  ["q1", "health", "A long-running back problem makes the long days harder than they need to be."],
  ["q1", "recognition", "It would help to know the extra hours are actually noticed."],
  ["q2", "family", "School pick-ups don't fit well with late meetings."],
  ["q2", "learning", "I'm studying part time and assignment weeks are really tough to balance."],
  ["q2", "health", "I've stopped going to the gym because there's no time left in the day."],
  ["q2", "flexibility", "Being able to start earlier on some days would make a big difference."],
  ["q3", "manager", "Regular one-to-ones would help, ours often get cancelled."],
  ["q3", "manager", "More clarity on what good looks like in my role."],
  ["q3", "recognition", "A bit more feedback when things go well, not only when they don't."],
  ["q3", "communication", "I'd like to hear about changes from my manager before the rest of the team does."],
  ["q4", "recognition", "Celebrate the people quietly keeping things running, not just the big wins."],
  ["q4", "communication", "Share the reasons behind decisions, even when the answer is no."],
  ["q4", "communication", "Fewer surprises. Big changes should come with a heads-up."],
  ["q4", "flexibility", "Trust people to manage their own hours when the work gets done."],
  ["q4", "stress", "It should be okay to say you're at capacity without it being seen as a weakness."],
  ["q4", "learning", "Make it easier to move between teams and learn something new."],
  ["q4", "tools", "Cut down the number of approvals needed for small purchases."],
  ["q5", "environment", "The open-plan area is too loud to concentrate for long."],
  ["q5", "environment", "More quiet rooms for focused work or private calls."],
  ["q5", "environment", "The air conditioning is either freezing or not working."],
  ["q5", "health", "Better chairs and desks that can be raised would help a lot of us."],
  ["q5", "tools", "Meeting rooms need screens that work first time."],
  ["q6", "tools", "Logging time in three different systems takes up most of Friday afternoon."],
  ["q6", "tools", "The laptop takes ten minutes to start up every morning."],
  ["q6", "workload", "Waiting on slow systems pushes everything else back."],
  ["q6", "communication", "Nobody tells us when a system is going to be down."],
].map(([question, theme, text], i) => ({ id: i + 1, question, theme, text }));

/* A short written summary of a set of questions, built from their themes (sample: the real product would send the
   verbatims to a model). Returns paragraphs. */
export function summaryFor(questionIds) {
  const total = QUESTIONS.filter((q) => questionIds.includes(q.id)).reduce((a, q) => a + q.responses, 0);
  const themes = themeTotals(questionIds);
  if (!themes.length) return [];
  const pct = (n) => Math.round((n / (total || 1)) * 100);
  const [a, b, c, ...rest] = themes;
  const paras = [
    `${a.label} comes up most, in ${a.value} of ${total} responses (${pct(a.value)}%). People describe ${a.about}.`,
    b ? `${b.label} follows${c ? `, with ${c.label} close behind` : ""}. These responses talk about ${b.about}${c ? `, and ${c.about}` : ""}.` : null,
    rest.length ? `Smaller themes include ${rest.slice(0, 3).map((t) => t.label.toLowerCase()).join(", ")}. Each is raised by fewer people, but they point to specific things that could be changed quickly.` : null,
    `Read these alongside the scores: a theme raised often under a low-scoring Explorer is a good place to start.`,
  ];
  return paras.filter(Boolean);
}
