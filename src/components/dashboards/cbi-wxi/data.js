/* ================================================================== */
/* CBI · WXI Site Dashboard: the numbers, transcribed from the client's  */
/* Power BI prototype ("Prototype Operator Actions CBI WXI Site          */
/* Dashboard.pdf", 6 pages, September 2026). Nothing here is invented:   */
/* where the PDF only shows one example (one Driver's answers, one        */
/* department), the mockup shows that example and says so.               */
/* ================================================================== */

export const META = {
  client: "Central Bank of Ireland",
  operator: "Sodexo",
  surveyed: "September 2026",
  n: 584,
  departments: 20,
  wxi: 58,
  happyPeople: 51,
  healthyBuildings: 65,
};

/* Status bands, as the PDF colours them: 80+ Flourishing, 60 to 79 Striving, under 60 Struggling. */
export const statusOf = (v) => (v >= 80 ? "Flourishing" : v >= 60 ? "Striving" : "Struggling");

/* Who can fix it, and when (page 1's four groups). */
export const OWNERS = [
  { id: "act", name: "Act now", owner: "Sodexo", when: "Within 30 days" },
  { id: "plan", name: "Sodexo plan", owner: "Sodexo", when: "1 to 3 months" },
  { id: "cbi", name: "CBI decision", owner: "CBI", when: "Raise at next review" },
  { id: "nudge", name: "Nudge & track", owner: "Staff habits", when: "Checked at each pulse" },
];

/* The 15 Struggling Drivers (page 1). hot = the hardest-hit department: % Struggling there and its size. */
export const ACTIONS = [
  { driver: "Fruit & Vegetable Intake", owner: "act", score: 21, struggling: 61, hot: { dept: "7W ERP", pct: 100, n: 5 }, action: "Add fruit or veg to every meal deal and grab-and-go item." },
  { driver: "Hydration & Fluid Intake", owner: "act", who: "Sodexo + CBI", score: 41, struggling: 49, hot: { dept: "Project Teams", pct: 83, n: 6 }, action: "Check water points on each floor, then run a refill campaign across the Site." },
  { driver: "Nutrition Labelling Awareness", owner: "plan", score: 36, struggling: 51, hot: { dept: "5W Regulatory", pct: 75, n: 12 }, action: "Show calories and allergens on every item, in the café and the app." },
  { driver: "Access to Healthy Food & Drinks", owner: "plan", score: 56, struggling: 38, hot: { dept: "5W Regulatory", pct: 58, n: 12 }, action: "Review healthy options, opening hours and vending near the lowest-scoring floors." },
  { driver: "Meeting Room Temperature", owner: "cbi", score: 28, struggling: 59, hot: { dept: "CIO", pct: 80, n: 50 }, action: "Review meeting-room heating and cooling settings, starting with the hot spot." },
  { driver: "Workstation Temperature", owner: "cbi", score: 36, struggling: 52, hot: { dept: "Finance & Perf.", pct: 70, n: 27 }, action: "Review desk-area temperature settings floor by floor." },
  { driver: "Workstation Noise Levels", owner: "cbi", score: 37, struggling: 52, hot: { dept: "4E Policy", pct: 72, n: 18 }, action: "Agree quiet zones and call etiquette near desks." },
  { driver: "Collaboration Space Noise Levels", owner: "cbi", score: 37, struggling: 51, hot: { dept: "4E Policy", pct: 83, n: 18 }, action: "Agree quiet zones and an acoustic check for open collaboration spaces." },
  { driver: "Office Air Quality", owner: "cbi", score: 40, struggling: 49, hot: { dept: "Finance & Perf.", pct: 67, n: 27 }, action: "Service filters and share air-quality readings with staff." },
  { driver: "Organisational Support for Physical Activity", owner: "cbi", score: 43, struggling: 47, hot: { dept: "5W Regulatory", pct: 67, n: 12 }, action: "Publicise stair access and activity groups; review facilities." },
  { driver: "Collaboration Space Temperature", owner: "cbi", score: 58, struggling: 37, hot: { dept: "5W Regulatory", pct: 58, n: 12 }, action: "Review open-space heating and cooling zones with facilities." },
  { driver: "Physical Activity Levels", owner: "cbi", score: 57, struggling: 29, hot: null, action: "Support walking meetings and activity challenges." },
  { driver: "Limit Sugar, Fat & Salt", owner: "nudge", score: 20, struggling: 70, hot: { dept: "7W ERP", pct: 100, n: 5 }, action: "Monthly “easy swap” campaign at the till, tracked at each pulse." },
];
/* Who acts: Sodexo for "Act now" / "Sodexo plan", CBI for "CBI decision", staff for "Nudge & track"; Hydration is shared
   (the Department page's "Sodexo + CBI"). */
export const whoActs = (a) => a.who || { act: "Sodexo", plan: "Sodexo", cbi: "CBI", nudge: "Staff" }[a.owner];
/* The PDF says 15 Struggling Drivers and 13 actions; its board lists these 13. */
export const STRUGGLING_DRIVERS = 15;

/* Page 2: the one Driver the PDF drills into. */
export const ACTION_DETAIL = {
  driver: "Collaboration Space Noise Levels",
  owner: "cbi",
  topic: "Open Collaboration Spaces",
  question: "Open collaboration spaces are well-maintained and fully functional in the following areas: Noise",
  score: 37,
  n: 584,
  answers: [
    { label: "Strongly disagree", n: 31, status: "Struggling" },
    { label: "Disagree", n: 117, status: "Struggling" },
    { label: "Neutral", n: 150, status: "Struggling" },
    { label: "Agree", n: 191, status: "Striving" },
    { label: "Strongly agree", n: 95, status: "Flourishing" },
  ],
  split: { Struggling: 51, Striving: 33, Flourishing: 16 },
  lowest: [
    { group: "4E Policy", by: "Department", n: 18, score: 13 },
    { group: "5W Regulatory", by: "Department", n: 12, score: 18 },
    { group: "Prefer not to respond / Other", by: "Gender", n: 39, score: 19 },
    { group: "3W Capital Markets", by: "Department", n: 57, score: 21 },
    { group: "3E Enforcement", by: "Department", n: 23, score: 24 },
  ],
  highest: [{ group: "Less than 1 year", by: "Tenure", n: 15, score: 84 }],
  plan: {
    why: "High noise levels in collaboration spaces can disrupt thought flow, signalling a need for better sound management. 51% of people are Struggling on this Driver, rising to 83% in 4E Policy & International (18 people).",
    quick: "Agree quiet zones and noise conduct guidelines for open collaboration spaces.",
    bigger: "Install acoustic panels and sound masking; rearrange furniture and add soft furnishings.",
    measure: "Target to be set at the review with Sodexo.",
  },
  related: null, // "No home-vs-work comparison applies to this Driver. Only the Nutrition and Physical Activity Drivers have one."
};

/* Page 3: % Struggling by department × Driver (top 8 of each). */
export const HEAT = {
  drivers: ["Collaboration Space Noise Levels", "Fruit & Vegetable Intake", "Hydration & Fluid Intake", "Limit Sugar, Fat & Salt", "Meeting Room Temperature", "Nutrition Labelling Awareness", "Workstation Noise Levels", "Workstation Temperature"],
  site: [51, 61, 49, 70, 59, 51, 52, 52],
  rows: [
    { dept: "2E Financial Stability", n: 30, v: [60, 60, 47, 67, 73, 60, 70, 47] },
    { dept: "3E Enforcement", n: 23, v: [65, 52, 70, 78, 57, 48, 65, 70] },
    { dept: "3W Capital Markets", n: 57, v: [68, 58, 54, 75, 68, 61, 54, 61] },
    { dept: "4E Policy", n: 18, v: [83, 72, 67, 56, 67, 56, 72, 67] },
    { dept: "5W Regulatory", n: 12, v: [75, 83, 50, 83, 67, 75, 67, 67] },
    { dept: "CIO", n: 50, v: [46, 60, 44, 72, 80, 54, 54, 64] },
    { dept: "Economics & Statistics", n: 22, v: [55, 82, 45, 82, 73, 59, 59, 64] },
    { dept: "Finance & Perf.", n: 27, v: [56, 52, 52, 70, 70, 52, 59, 70] },
  ],
  note: "Women struggle more with temperature than men: 62% vs 52% Struggling on Meeting Room Temperature.",
};
/* Gap between best and worst group, in points of people Struggling (average over the 15 Struggling Drivers). */
export const DIFFERENCE = [
  { by: "Department", gap: 43 },
  { by: "Tenure", gap: 24 },
  { by: "Gender", gap: 24 },
  { by: "Age", gap: 18 },
];
export const FOOD_VOICE = [
  { stat: "97%", text: "say a healthy diet affects how they feel at work", sub: "72% “a great deal”, 26% “somewhat”" },
  { stat: "55%", text: "eat healthier at home than at work", sub: "A further 38% say about the same" },
  { stat: "105", text: "of 247 written comments ask for calories, ingredients or labels", sub: null },
  { stat: "34%", text: "name time as their biggest barrier to eating well", sub: "So convenience matters more than price" },
];
export const FLOURISHING = [
  { driver: "Fast Food & Takeaway Habits", score: 94 },
  { driver: "Sugary Drinks Consumption", score: 94 },
  { driver: "Meeting Room Cleanliness", score: 92 },
  { driver: "Snacking Habits", score: 91 },
  { driver: "Collaboration Space Cleanliness", score: 90 },
  { driver: "Workstation Ergonomics", score: 80 },
  { driver: "Workstation Lighting", score: 80 },
];

/* Page 4: the index. Pillars and their topics (the wheel: Healthy Buildings on the left, Happy People on the right). */
export const PILLARS = [
  { name: "Healthy Buildings", score: 65, topics: [{ name: "Workstations", score: 62 }, { name: "Open Collaboration Spaces", score: 66 }, { name: "Meeting Rooms", score: 67 }] },
  { name: "Happy People", score: 51, topics: [{ name: "Eating Habits", score: 65 }, { name: "Nutrition", score: 50 }, { name: "Physical Activity", score: 42 }, { name: "Health Awareness", score: 46 }] },
];
export const STATE = { Flourishing: 7, Striving: 13, Struggling: 15 };
export const WHO = {
  gender: [{ label: "Female", n: 295 }, { label: "Male", n: 250 }, { label: "Prefer not to say", n: 39 }],
  location: [{ label: "Hybrid", pct: 93 }, { label: "Office", pct: 6 }, { label: "Home", pct: 1 }],
  tenure: [{ label: "<1 yr", n: 15 }, { label: "1-3", n: 85 }, { label: "3-5", n: 87 }, { label: "5-10", n: 174 }, { label: "10-20", n: 151 }, { label: "20+", n: 72 }],
};
/* Every Driver score shown on page 4 (top of the list) plus the Struggling ones from page 1. */
export const DRIVER_SCORES = [
  ["Fast Food & Takeaway Habits", 94], ["Sugary Drinks Consumption", 94], ["Meeting Room Cleanliness", 92], ["Snacking Habits", 91],
  ["Collaboration Space Cleanliness", 90], ["Workstation Ergonomics", 80], ["Workstation Lighting", 80], ["Collaboration Space Lighting", 79],
  ["Ultra-Processed Food Consumption", 79], ["Coffee Consumption", 78], ["Meeting Room Noise Levels", 76], ["Meeting Room Lighting", 71],
  ["Workstation Cleanliness", 71], ["Meeting Room Equipment", 70], ["Meeting Room Ergonomics", 70], ["Health Awareness Promotion", 67],
  ["Collaboration Space Equipment", 66], ["Workstation Equipment", 65], ["Workplace Sitting Time", 64], ["Collaboration Space Ergonomics", 63],
  ["Collaboration Space Temperature", 58], ["Physical Activity Levels", 57], ["Access to Healthy Food & Drinks", 56],
  ["Organisational Support for Physical Activity", 43], ["Hydration & Fluid Intake", 41], ["Office Air Quality", 40],
  ["Workstation Noise Levels", 37], ["Collaboration Space Noise Levels", 37], ["Nutrition Labelling Awareness", 36],
  ["Workstation Temperature", 36], ["Meeting Room Temperature", 28], ["Fruit & Vegetable Intake", 21], ["Limit Sugar, Fat & Salt", 20],
].map(([driver, score]) => ({ driver, score }));

/* Page 5: one department (3E Enforcement) against the Site. */
export const DEPT_VIEW = {
  dept: "3E Enforcement",
  people: 23,
  avgStruggling: 61,
  siteAvgStruggling: 55,
  worse10: 7,
  rank: 3,
  of: 18,
  rows: [
    ["Limit Sugar, Fat & Salt", 78, 70], ["Hydration & Fluid Intake", 70, 49], ["Workstation Temperature", 70, 52],
    ["Collaboration Space Noise Levels", 65, 51], ["Workstation Noise Levels", 65, 52], ["Office Air Quality", 61, 49],
    ["Organisational Support for Physical Activity", 61, 47], ["Meeting Room Temperature", 57, 59], ["Workstation Equipment", 57, 33],
    ["Fruit & Vegetable Intake", 52, 61], ["Access to Healthy Food & Drinks", 48, 38], ["Nutrition Labelling Awareness", 48, 51],
    ["Workstation Lighting", 43, 22], ["Collaboration Space Ergonomics", 35, 34], ["Meeting Room Ergonomics", 30, 29],
    ["Physical Activity Levels", 30, 29], ["Workplace Sitting Time", 30, 31],
  ].map(([driver, dept, site]) => ({ driver, dept, site, gap: dept - site })),
  raise: [
    { driver: "Collaboration Space Noise Levels", owner: "CBI", ask: "Agree quiet zones and an acoustic check for open collaboration spaces.", dept: 65, site: 51 },
    { driver: "Hydration & Fluid Intake", owner: "Sodexo + CBI", ask: "Check water points on each floor, then run a refill campaign across the Site.", dept: 70, site: 49 },
    { driver: "Organisational Support for Physical Activity", owner: "CBI", ask: "Publicise stair access and activity groups; review facilities.", dept: 61, site: 47 },
    { driver: "Workstation Temperature", owner: "CBI", ask: "Review desk-area temperature settings floor by floor.", dept: 70, site: 52 },
  ],
};
export const LEAGUE = [
  ["5W Regulatory", 12, 65], ["4E Policy", 18, 62], ["3E Enforcement", 23, 61], ["3W Capital Markets", 57, 61], ["Economics & Statistics", 22, 61],
  ["Finance & Perf.", 27, 60], ["2E Financial Stability", 30, 58], ["CIO", 50, 57], ["Strategy & Governance", 48, 56], ["5W Supervisory Risk", 43, 54],
  ["Other / Contractor", 26, 53], ["5E Insurance", 27, 53], ["7W Financial Ops", 26, 52], ["4W Horizontal Sup.", 52, 51], ["Project Teams", 6, 51],
  ["7W ERP", 5, 51], ["6W Banking & Payments", 52, 50], ["6E People & Workplace", 56, 44],
].map(([dept, people, avg]) => ({ dept, people, avg }));

/* Page 6: one Driver in detail. */
export const DRIVER_DETAIL = {
  driver: "Access to Healthy Food & Drinks",
  dimension: { name: "Happy People", score: 51 },
  topic: { name: "Nutrition", score: 50 },
  score: 56,
  n: 584,
  question: "Healthy food and drink options are readily accessible at or near my workplace.",
  answers: [
    { label: "Strongly disagree", n: 18, status: "Struggling" },
    { label: "Disagree", n: 76, status: "Struggling" },
    { label: "Neutral", n: 128, status: "Struggling" },
    { label: "Agree", n: 277, status: "Striving" },
    { label: "Strongly agree", n: 85, status: "Flourishing" },
  ],
  split: { Struggling: 38, Striving: 47, Flourishing: 15 },
  siblings: [{ driver: "Access to Healthy Food & Drinks", score: 56 }, { driver: "Hydration & Fluid Intake", score: 41 }, { driver: "Nutrition Labelling Awareness", score: 36 }],
  groups: [
    { by: "Gender", high: { group: "Female", n: 295, score: 63 }, low: { group: "Prefer not to respond / Other", n: 39, score: 18 } },
    { by: "Tenure", high: { group: "Less than 1 year", n: 15, score: 69 }, low: { group: "1-3 years", n: 85, score: 49 } },
    { by: "Department", high: { group: "6E People & Workplace", n: 56, score: 90 }, low: { group: "5W Regulatory & Business Services", n: 12, score: 29 } },
    { by: "Age range", high: { group: "46-55", n: 172, score: 67 }, low: { group: "18-25", n: 27, score: 46 } },
  ],
  actions: [
    "Increase the range and visibility of healthy food and drink options, ensuring all dietary requirements are met across all operations, including vending.",
    "Partner with HR on education initiatives, including cooking lessons and recipe cards.",
    "Regularly assess demand through employee forums and align food availability with…", // cut off in the source report
  ],
};

/* Which topic each Driver sits in, for the wheel's click-to-filter. The PDF confirms Nutrition (page 6: Access to Healthy Food &
   Drinks, Hydration & Fluid Intake, Nutrition Labelling Awareness); the rest are read from the Driver names (Meeting Room…,
   Workstation…, Collaboration Space…) and the food questions on page 3, so in Power BI they come from the model. Drivers whose
   topic isn't clear from the name (Office Air Quality) are left out of every topic. */
export const TOPIC_OF = (d) => {
  if (/^Meeting Room/.test(d)) return "Meeting Rooms";
  if (/^Workstation/.test(d)) return "Workstations";
  if (/^Collaboration Space/.test(d)) return "Open Collaboration Spaces";
  if (["Access to Healthy Food & Drinks", "Hydration & Fluid Intake", "Nutrition Labelling Awareness"].includes(d)) return "Nutrition";
  if (["Fast Food & Takeaway Habits", "Sugary Drinks Consumption", "Snacking Habits", "Ultra-Processed Food Consumption", "Coffee Consumption", "Limit Sugar, Fat & Salt", "Fruit & Vegetable Intake"].includes(d)) return "Eating Habits";
  if (["Physical Activity Levels", "Organisational Support for Physical Activity", "Workplace Sitting Time"].includes(d)) return "Physical Activity";
  if (d === "Health Awareness Promotion") return "Health Awareness";
  return null;
};
/* Health Age: the source report shows "Unavailable · Not requested by the client". When a client asks for it the card shows the
   Site's average Health Age against actual age. No Health Age data exists in this source, so the requested state uses SAMPLE
   values, tagged as such. */
export const HEALTH_AGE = { requested: false, sample: { healthAge: 41.6, actualAge: 39.2 } };
