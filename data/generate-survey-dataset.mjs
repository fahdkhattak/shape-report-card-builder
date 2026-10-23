/* ================================================================== */
/* GENERATE THE SHAPE SURVEY DATASET — 150 people × 3 rounds.            */
/*                                                                      */
/*   npm run dataset   (from /data; run `npm run survey` first if the   */
/*                      survey record changed)                          */
/*                                                                      */
/* Reads the survey record (src/data/surveys/shape-survey.json) and     */
/* writes src/data/surveys/shape-survey-responses.json: each person's   */
/* Your Profile answers and their raw answers to every question they    */
/* were asked, round by round. Scores are NOT stored: the product works  */
/* them out from the answers with src/lib/survey/scoring.js, the same   */
/* code this script uses for its checks, so stored data can't disagree  */
/* with the scoring rules.                                              */
/*                                                                      */
/* How answers are made (synthetic, but shaped like a real org):        */
/*  - Each person has latent traits (z-scores): general outlook, body,  */
/*    mind, life outside work, job fit, manager, team, view of the org, */
/*    workload, office and home environment, IT.                         */
/*  - Department, site and work model shift those traits (a struggling  */
/*    Customer Services team, a strong R&D team, home workers lonelier  */
/*    but freer), and the rounds tell a story: workload bites in round  */
/*    2, a manager programme and workload fixes lift round 3.            */
/*  - A question's answer is the option whose score sits nearest a      */
/*    target drawn from its traits, plus noise. So answers are always   */
/*    real options, and correlations (Sleep with Stress, Workload with  */
/*    Work-life balance) come from shared traits, not from a formula.   */
/*  - Who is asked what follows the survey: home questions only for     */
/*    Home and Hybrid people, the WFH-vs-office question only for       */
/*    Hybrid, the manager questions only for managers, two answers      */
/*    (office, home) to the work-environment questions for Hybrid, N/A  */
/*    where it applies (no dependants → caring is N/A, Home → commuting */
/*    is N/A).                                                          */
/* Seeded: the same seed always gives the same people.                   */
/* ================================================================== */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { indexSurvey, scoreResponse, enpsOf, workModelOf, bmiOf } from "../src/lib/survey/scoring.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SURVEY = JSON.parse(fs.readFileSync(path.join(HERE, "../src/data/surveys/shape-survey.json"), "utf8"));
const OUT = path.join(HERE, "../src/data/surveys/shape-survey-responses.json");
const { questions, byId } = indexSurvey(SURVEY);

/* ---- randomness ---------------------------------------------------- */
const SEED = 20261020;
let s = SEED;
const rand = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/* A second, separate stream for cosmetic choices (job titles), so changing them never moves anyone's answers. */
let s2 = SEED + 7;
const randT = () => { s2 |= 0; s2 = (s2 + 0x6d2b79f5) | 0; let t = Math.imul(s2 ^ (s2 >>> 15), 1 | s2); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pickT = (arr) => arr[Math.floor(randT() * arr.length)];
const randn = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const weighted = (pairs) => { const t = pairs.reduce((a, [, w]) => a + w, 0); let r = rand() * t; for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; } return pairs[pairs.length - 1][0]; };
const deal = (counts) => { const bag = Object.entries(counts).flatMap(([k, n]) => Array(n).fill(k)); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } return bag; };

/* ---- the organisation ---------------------------------------------- */
const N = 150;
const ROUNDS = [
  { id: "r1", label: "Nov 2025", closedAt: "2025-11-17" },
  { id: "r2", label: "Mar 2026", closedAt: "2026-03-16" },
  { id: "r3", label: "Aug 2026", closedAt: "2026-08-17" },
];
/* Sites: the client's editable list (Your Profile Q9). Home workers answer "Does not apply". */
const SITES = [
  { code: "SYD-HQ", name: "Sydney HQ", country: "Australia", currency: "AUD", env: 0.25, tech: 0.2, commute: 55 },
  { code: "MEL-02", name: "Melbourne", country: "Australia", currency: "AUD", env: 0.0, tech: 0.0, commute: 45 },
  { code: "AKL-01", name: "Auckland", country: "New Zealand", currency: "NZD", env: 0.1, tech: -0.1, commute: 40 },
  { code: "SIN-01", name: "Singapore", country: "Singapore", currency: "SGD", env: 0.3, tech: 0.3, commute: 50 },
  { code: "LON-01", name: "London", country: "United Kingdom", currency: "GBP", env: -0.35, tech: -0.2, commute: 70 },
];
const SITE_WEIGHTS = [["SYD-HQ", 40], ["MEL-02", 28], ["AKL-01", 24], ["SIN-01", 24], ["LON-01", 18]];

/* Departments (Q8, the file's list) with headcounts and what they're like. */
const DEPTS = {
  "Operations": { n: 18, workload: -0.1, culture: 0, mgr: 0 },
  "Customer Services/Support": { n: 16, workload: -0.7, mind: -0.35, culture: -0.35, mgr: -0.2, team: 0.1 },
  "Production": { n: 14, env: -0.45, phys: -0.1, culture: -0.1 },
  "IT": { n: 14, tech: 0.4, mgr: 0.25, job: 0.15 },
  "Business Development/Sales": { n: 14, workload: -0.3, job: 0.2, mind: -0.1 },
  "Accounting and Finance": { n: 10, workload: -0.2, culture: 0.1 },
  "Human Resources": { n: 8, culture: 0.3, team: 0.2 },
  "Marketing and Advertising": { n: 10, job: 0.2, team: 0.15 },
  "Research and Development": { n: 10, job: 0.45, team: 0.2, culture: 0.15 },
  "Distribution": { n: 9, env: -0.3, phys: -0.05, mgr: -0.15 },
  "Purchasing": { n: 7, culture: -0.1 },
  "Legal": { n: 5, workload: -0.25, culture: 0.1 },
  "Management/Admin": { n: 15, culture: 0.35, job: 0.2, mgr: 0.1, workload: -0.15 },
};
const HANDS_ON = new Set(["Production", "Distribution"]);

/* What the rounds did to everyone (added to the traits). Round 2: workload bites. Round 3: a manager programme and a
   workload review land. */
const ROUND_SHIFT = [
  { workload: 0, mind: 0, mgr: 0, culture: 0, g: 0 },
  { workload: -0.4, mind: -0.2, mgr: 0, culture: -0.2, g: -0.12 },
  { workload: 0.25, mind: 0.15, mgr: 0.45, culture: 0.25, g: 0.1 },
];

/* ---- names and titles ------------------------------------------------ */
const FIRST = {
  Female: ["Aisha", "Charlotte", "Mei", "Priya", "Olivia", "Hana", "Ngaio", "Sofia", "Grace", "Amara", "Leila", "Chloe", "Isabel", "Yuki", "Aroha", "Zara", "Ruby", "Anika", "Ellie", "Fatima", "Jasmine", "Nadia", "Siobhan", "Wen", "Tamsin", "Maya", "Holly", "Rosa", "Kiri", "Lucy"],
  Male: ["James", "Arjun", "Liam", "Wei", "Tama", "Oliver", "Mohammed", "Ethan", "Hiroshi", "Noah", "Rahul", "Lachlan", "Daniel", "Kai", "Samuel", "Tomás", "Isaac", "Rawiri", "Ben", "Hamish", "Jun", "Omar", "Felix", "Callum", "Ravi", "Leo", "Marcus", "Theo", "Aiden", "Nikhil"],
  Other: ["Alex", "Jordan", "Sam", "Riley", "Quinn", "Morgan", "Ash"],
};
const LAST = ["Nguyen", "Smith", "Patel", "Wilson", "Tan", "Brown", "Ngata", "Chen", "Taylor", "Kaur", "Williams", "Lim", "Jones", "Singh", "O'Brien", "Kumar", "Walker", "Wong", "Harris", "Fernando", "Martin", "Ahmed", "Thompson", "Lee", "Clarke", "Parata", "Murphy", "Ong", "Robinson", "Hassan", "Davies", "Ito", "Kelly", "Reddy", "Evans", "Teo", "Hughes", "Rahman", "King", "Tuhiwai", "Wright", "Zhang", "Scott", "Ali", "Green", "Sato", "Baker", "Hill", "Costa", "Bell"];
const TITLES = {
  "Operations": ["Operations Coordinator", "Operations Analyst", "Logistics Officer"],
  "Customer Services/Support": ["Customer Support Officer", "Service Desk Analyst", "Customer Success Specialist"],
  "Production": ["Production Technician", "Machine Operator", "Quality Inspector"],
  "IT": ["Software Engineer", "Systems Administrator", "Data Analyst", "IT Support Specialist"],
  "Business Development/Sales": ["Account Executive", "Sales Representative", "Business Development Executive", "Sales Coordinator"],
  "Accounting and Finance": ["Accountant", "Payroll Officer", "Financial Analyst", "Accounts Payable Officer"],
  "Human Resources": ["HR Advisor", "Recruitment Coordinator", "People Partner", "HR Administrator"],
  "Marketing and Advertising": ["Marketing Coordinator", "Content Specialist", "Brand Executive", "Digital Marketing Analyst"],
  "Research and Development": ["Research Scientist", "Product Developer", "Lab Technician", "R&D Engineer"],
  "Distribution": ["Warehouse Operator", "Dispatch Coordinator", "Forklift Operator", "Fleet Coordinator"],
  "Purchasing": ["Buyer", "Procurement Officer", "Supply Analyst"],
  "Legal": ["Legal Counsel", "Paralegal", "Compliance Officer"],
  "Management/Admin": ["Office Coordinator", "Executive Assistant", "Administration Officer", "Strategy Analyst"],
};

/* A job title that fits the level: managers get a manager's title, interns and students say so. */
const AREA = { "Operations": "Operations", "Customer Services/Support": "Customer Support", "Production": "Production", "IT": "Technology", "Business Development/Sales": "Sales", "Accounting and Finance": "Finance", "Human Resources": "People and Culture", "Marketing and Advertising": "Marketing", "Research and Development": "Research and Development", "Distribution": "Distribution", "Purchasing": "Procurement", "Legal": "Legal", "Management/Admin": "Administration" };
const titleFor = (dept, level) => {
  const area = AREA[dept];
  if (level === "Junior management") return pickT([`${area} Team Lead`, `${area} Supervisor`]);
  if (level === "Middle management") return pickT([`${area} Manager`, `Senior ${area} Manager`]);
  if (level === "Upper management") return dept === "Management/Admin" ? pickT(["Chief Operating Officer", "General Manager", "Chief Executive Officer"]) : pickT([`Head of ${area}`, `Director of ${area}`]);
  if (level === "Intern") return `${area} Intern`;
  if (level === "Student") return `${area} Student Placement`;
  if (level === "Consultant") return `${area} Consultant`;
  if (level === "Self-employed/Partner") return dept === "Legal" ? "Partner" : `${area} Partner`;
  return pickT(TITLES[dept]);
};

/* Free-text answers: short, plain, varied. About a third of people write something in a given round. */
const COMMENTS = {
  PHYS9: ["Get to bed earlier during the week.", "Walk at lunch instead of eating at my desk.", "Cut back on takeaway.", "Book the physio I keep putting off.", "Drink more water and less coffee.", "Join a weekend sports team again."],
  PSY6: ["Looking after a parent who has been unwell.", "Renovations at home have been stressful.", "Uncertainty about the restructure.", "Visa renewal paperwork.", "A long commute when the trains are late."],
  "FOW1.5": ["Study for a part-time degree.", "Volunteering at my kids' school.", "Caring for my grandmother on weekends.", "A second job on Saturdays."],
  JS3: ["Too many meetings leave little time for real work.", "Unclear priorities between two managers.", "Repetitive tasks that could be automated.", "Not enough say in how work is planned."],
  EC3: ["Pay hasn't kept up with living costs.", "Few chances to move into a new role.", "Feeling like decisions are made far away from us.", "Good team, but the workload is wearing people down."],
  EE2: ["Different time zones make it hard to connect.", "We rarely see our manager in person.", "Team meetings are mostly status updates.", "More time to work together on problems would help."],
  CD2: ["Share knowledge instead of keeping it in silos.", "Raise problems earlier.", "Answer messages a bit faster.", "Celebrate the small wins together."],
  "MS2.7": ["More regular one-to-ones.", "Clearer feedback on what good looks like.", "Hearing about changes from my manager first.", "Being trusted to make more decisions."],
  CC3: ["Explain the reasons behind decisions.", "Less blame when things go wrong.", "More recognition for the quiet work.", "Make flexible work the norm, not a favour."],
  S2: ["Old systems slow everything down.", "Too many approvals for small purchases.", "Strategy changes too often.", "Hiring hasn't kept up with growth."],
  "PhysWE1.9": ["More quiet rooms for focused work.", "Fix the air conditioning on level 3.", "Better chairs.", "More meeting rooms with working screens."],
  "SoftWE1.7": ["A better VPN when working from home.", "Fewer pop-up requests on chat.", "Faster laptops.", "A shared calendar for focus time."],
};

/* ---- people ---------------------------------------------------------- */
const deptBag = deal(Object.fromEntries(Object.entries(DEPTS).map(([d, v]) => [d, v.n])));
const people = [];
const usedNames = new Set();
for (let i = 0; i < N; i++) {
  const dept = deptBag[i], D = Object.fromEntries(Object.entries(DEPTS[deptBag[i]]).map(([k, v]) => [k, k === "n" ? v : v * 1.6]));
  const gender = weighted([["Female", 47], ["Male", 47], ["Other", 2], ["Prefer not to respond", 4]]);
  // Job level, shaped by department.
  const level = weighted([
    ["Administrative staff", dept === "Management/Admin" ? 30 : 8], ["Support staff", dept === "Customer Services/Support" ? 30 : 10],
    ["Trained professional", ["IT", "Accounting and Finance", "Legal", "Marketing and Advertising"].includes(dept) ? 40 : 22],
    ["Skilled labourer", HANDS_ON.has(dept) ? 40 : 1], ["Researcher", dept === "Research and Development" ? 35 : 0],
    ["Junior management", 12], ["Middle management", 10], ["Upper management", dept === "Management/Admin" ? 14 : 3],
    ["Consultant", ["IT", "Business Development/Sales"].includes(dept) ? 6 : 1], ["Self-employed/Partner", dept === "Legal" ? 6 : 0],
    ["Intern", 2], ["Student", 1], ["Other", 2],
  ]);
  const manager = /management/.test(level);
  const ageBase = level === "Intern" || level === "Student" ? 21 : level === "Upper management" ? 48 : manager ? 40 : 35;
  const age = Math.round(clamp(ageBase + randn() * (level === "Intern" || level === "Student" ? 2 : 9), 19, 66));
  const tenure = age < 24 ? weighted([["Less than 1 year", 5], ["1-3 years", 3]]) : weighted([["Less than 1 year", 12], ["1-3 years", 26], ["3-5 years", 22], ["5-10 years", age > 30 ? 22 : 6], ["10-20 years", age > 36 ? 13 : 0], ["20+ years", age > 46 ? 5 : 0]]);
  const employmentStatus = level === "Intern" || level === "Student" ? "Temporary" : weighted([["Full-time", 76], ["Part-time", 15], ["Casual", HANDS_ON.has(dept) ? 9 : 4], ["Temporary", 4]]);
  const hoursTotal = { "Full-time": pick([37.5, 38, 38, 40]), "Part-time": pick([16, 20, 22.5, 24, 30]), Casual: pick([12, 15, 18, 24]), Temporary: pick([30, 37.5, 38]) }[employmentStatus];
  // Where they work: hands-on roles are on site; the rest split Office / Hybrid / Home.
  const model = HANDS_ON.has(dept) || level === "Skilled labourer" ? "Office" : weighted([["Office", 45], ["Hybrid", 40], ["Home", 15]]);
  const homeShare = model === "Office" ? 0 : model === "Home" ? 1 : pick([0.2, 0.4, 0.4, 0.6]);
  const homeHours = Math.round(hoursTotal * homeShare * 2) / 2, officeHours = Math.round((hoursTotal - homeHours) * 2) / 2;
  const site = model === "Home" ? null : SITES.find((x) => x.code === weighted(SITE_WEIGHTS));
  const country = site ? site.country : weighted([["Australia", 50], ["New Zealand", 20], ["United Kingdom", 15], ["Singapore", 15]]);
  const currency = { Australia: "AUD", "New Zealand": "NZD", Singapore: "SGD", "United Kingdom": "GBP" }[country];
  // Annual salary in the local currency (the bands per country are still to come: survey issue I15).
  const levelPay = { "Administrative staff": 62, "Support staff": 58, "Trained professional": 92, "Skilled labourer": 68, Researcher: 98, "Junior management": 96, "Middle management": 128, "Upper management": 190, Consultant: 120, "Self-employed/Partner": 210, Intern: 38, Student: 30, Other: 65 }[level];
  const fx = { AUD: 1, NZD: 0.95, SGD: 0.95, GBP: 0.62 }[currency];
  const fte = hoursTotal / 38;
  const salary = Math.round((levelPay * 1000 * fx * fte * (1 + randn() * 0.12)) / 500) * 500;
  const education = weighted([["Did not complete high school", 3], ["High school graduate", HANDS_ON.has(dept) ? 30 : 10], ["University (incomplete)", 8], ["Trade/technical/vocational training", HANDS_ON.has(dept) ? 30 : 8], ["Bachelor's degree", 40], ["Master's degree", 18], ["Professional degree", dept === "Legal" ? 40 : 4], ["Doctoral degree", dept === "Research and Development" ? 25 : 1], ["Other", 2]]);
  const title = gender === "Female" ? weighted([["Ms", 55], ["Mrs", 25], ["Miss", 14], ["Dr", 6]]) : gender === "Male" ? weighted([["Mr", 94], ["Dr", 6]]) : weighted([["Ms", 30], ["Mr", 30], ["Dr", 10], ["Miss", 30]]);
  let first, last;
  do { first = pick(FIRST[gender === "Prefer not to respond" ? pick(["Female", "Male", "Other"]) : gender]); last = pick(LAST); } while (usedNames.has(first + last));
  usedNames.add(first + last);
  const birthYear = 2026 - age, birth = `${birthYear}-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`;
  const dependants = age > 27 && age < 58 ? rand() < 0.48 : rand() < 0.08;
  // Latent traits (z-scores): one general outlook `g` runs through all of them, so people differ as whole people.
  const g = randn() * 1.4;
  const T = {
    g,
    phys: 0.4 * g + 0.85 * randn() + (D.phys || 0) - (age - 38) * 0.012,
    mind: 0.5 * g + 0.8 * randn() + (D.mind || 0),
    life: 0.35 * g + 0.85 * randn() - (dependants ? 0.25 : 0) + (model === "Home" ? 0.2 : model === "Hybrid" ? 0.12 : 0),
    job: 0.5 * g + 0.8 * randn() + (D.job || 0),
    mgr: 0.35 * g + 0.9 * randn() + (D.mgr || 0),
    team: 0.35 * g + 0.85 * randn() + (D.team || 0) - (model === "Home" ? 0.35 : 0),
    culture: 0.45 * g + 0.8 * randn() + (D.culture || 0),
    workload: 0.25 * g + 0.9 * randn() + (D.workload || 0),
    env: 0.2 * g + 0.8 * randn() + (D.env || 0) + (site ? site.env : 0),
    homeEnv: 0.2 * g + 0.8 * randn() + 0.25,
    tech: 0.2 * g + 0.8 * randn() + (D.tech || 0) + (site ? site.tech : 0),
    pay: Math.log(salary / fx / 80000) * 1.2 + 0.3 * randn(),
  };
  // Mind leans on workload (stress), life on workload (balance).
  T.mind += 0.35 * T.workload; T.life += 0.3 * T.workload;
  // Joined during the survey's life: a recent starter only answers the rounds after they joined.
  const joinedRound = tenure === "Less than 1 year" ? (rand() < 0.5 ? 2 : 1) : 0;
  people.push({
    id: `P${String(i + 1).padStart(3, "0")}`,
    profile: {
      firstName: first, lastName: last, title, dateOfBirth: birth, age, gender, genderOther: gender === "Other" ? pick(["Non-binary", "Genderfluid", "Agender"]) : undefined,
      education, country, ethnicity: null, department: dept, site: site ? site.code : "Does not apply", jobTitle: titleFor(dept, level),
      employmentStatus, officeHours, homeHours, workModel: workModelOf({ officeHours, homeHours }), jobLevel: level, tenure,
      salary: { amount: salary, currency }, dependants, manager,
    },
    T, joinedRound, siteInfo: site,
  });
}

/* ---- answering ------------------------------------------------------ */
/* Pick the option whose score is nearest a 0-100 target; `noise` spreads people out. */
const nearest = (scores, target) => { let best = 0, d = Infinity; scores.forEach((v, i) => { if (typeof v !== "number") return; const dd = Math.abs(v - target); if (dd < d) { d = dd; best = i; } }); return best; };
/* Noise on an answer is mostly the person's own (the same each round: someone who reads a question harshly keeps doing
   so) plus a little that changes each round, so a person's answers are stable between rounds, as in real surveys. */
let CUR = null;
const keepNoise = (key, sd) => { const m = CUR.noise || (CUR.noise = {}); if (m[key] == null) m[key] = randn(); return m[key] * sd; };
const target = (z, key, base = 62, spread = 24) => clamp(base + spread * z + keepNoise(key, 10.5) + 5 * randn(), 0, 100);
const listAnswer = (qid, z, key = qid) => { const q = byId[qid]; return nearest(q.scores, target(z, key)); };
const naIndex = (qid) => byId[qid].options.findIndex((o) => /^n\/?a$/i.test(o));

/* Which traits drive each question, and how hard it is (an offset in z). Keys are question ids or prefixes. */
const DRIVE = {
  PHYS1: (t) => [t.phys + 0.1 * t.g, -0.2], PHYS2: (t) => [t.phys, -0.35], PHYS5: (t) => [0.45 * t.phys + 0.75 * t.mind, -0.2],
  "PSY1.": (t, q) => [q.driver === "Stress" ? 0.75 * t.mind + 0.35 * t.workload : q.driver === "Depression" ? 0.85 * t.mind + 0.2 * t.g : 0.85 * t.mind, q.driver === "Stress" ? 0.55 : 0.95],
  "PSY2.2": (t) => [0.5 * t.mind + 0.4 * t.phys, 0.3], "PSY3.": (t) => [0.6 * t.mind + 0.4 * t.g, 0.15],
  "PSY4.1": (t) => [t.workload, -0.15], "PSY4.2": (t) => [0.6 * t.env + 0.3 * t.mind, 0.2], "PSY4.3": (t) => [0.7 * t.team + 0.3 * t.mind, 0.3],
  "PSY4.4": (t) => [0.6 * t.culture + 0.3 * t.job, 0], "PSY4.5": (t) => [t.pay + 0.3 * t.mind, 0], "PSY4.6": (t) => [0.7 * t.culture + 0.3 * t.mind, 0.2],
  "PSY5.1": (t) => [0.6 * t.life + 0.4 * t.mind, 0.35], "PSY5.2": (t) => [t.life, -0.2], "PSY5.3": (t) => [0.7 * t.pay + 0.3 * t.mind, -0.1],
  "PSY5.4": (t) => [0.6 * t.mind + 0.4 * t.phys, 0.1], "PSY5.5": (t) => [0.6 * t.life + 0.3 * t.mind, 0.1],
  "FOW1.1": (t) => [t.life, 0.1], "FOW1.2": (t) => [t.life - 0.2, -0.1], "FOW1.4": (t) => [0.6 * t.workload + 0.4 * t.life, -0.2],
  FOW2: (t) => [0.6 * t.life + 0.5 * t.workload, 0], FOW3: (t) => [0.5 * t.g + 0.4 * t.life, 0.6],
  "JS1.1": (t) => [t.job, 0.1], "JS1.2": (t) => [t.workload, -0.15], "JS1.3": (t) => [0.6 * t.job + 0.4 * t.mgr, 0],
  "JS2.1": (t) => [t.job, 0.1], "JS2.2": (t) => [t.job, 0.1], "JS2.3": (t) => [t.workload, -0.1], "JS2.4": (t) => [0.5 * t.tech + 0.5 * t.culture, 0.2], "JS2.5": (t) => [t.job, 0.35],
  "EC1.1": (t) => [t.culture, 0.2], "EC1.2": (t) => [0.6 * t.culture + 0.5 * t.pay, -0.35], "EC1.3": (t) => [0.6 * t.mgr + 0.4 * t.culture, -0.2],
  "EC1.4": (t) => [0.6 * t.team + 0.4 * t.culture, 0.35], "EC1.5": (t) => [0.6 * t.culture + 0.3 * t.job, -0.45], "EC1.6": (t) => [0.6 * t.job + 0.3 * t.g, 0], EC2: (t) => [0.5 * t.culture + 0.5 * t.team, 0.75],
  "EE1.1": (t) => [t.team, 0.6], "EE1.2": (t) => [t.team, 0.2], "EE1.3": (t) => [t.mgr, -0.35], "EE1.4": (t) => [t.culture, -0.1], "EE1.5": (t) => [t.job, 0.45],
  "EE1.6": (t) => [0.6 * t.mgr + 0.4 * t.culture, -0.1], "EE1.7": (t) => [t.mgr, 0.35], "EE1.8": (t) => [t.team, -0.5], "EE1.9": (t) => [t.job, 0.1],
  "CD1.": (t, q) => [t.team, { "1.1": 0.4, "1.2": 0.5, "1.3": 0.1, "1.4": 0, "1.5": 0.35, "1.6": 0.3, "1.7": 0.15, "1.8": 0.1, "1.9": -0.2, "1.10": -0.35, "1.11": 0.4, "1.12": 0.2 }[q.number] ?? 0],
  "MS2.2": (t) => [t.mgr, 0.25], "MS2.3": (t) => [t.mgr, -0.55], "MS2.4": (t) => [t.mgr, 0.15], "MS2.5": (t) => [t.mgr, 0.05], "MS2.6": (t) => [t.mgr, 0],
  "CC1.": (t, q) => [t.culture, { "1.1": 0.1, "1.2": 0.4, "1.3": 0.25, "1.4": -0.35, "1.5": -0.2, "1.6": 0.1, "1.7": 0, "1.8": 0.1, "1.9": -0.4, "1.10": 0.3, "1.11": 0.05, "1.12": -0.1, "1.13": 0, "1.14": -0.15, "1.15": 0.25, "1.16": -0.45, "1.17": 0.3, "1.18": -0.5, "1.19": 0.4, "1.20": -0.2, "1.21": 0.1, "1.22": 0.5 }[q.number] ?? 0],
  "S1.": (t, q) => [{ "1.1": 0.4 * t.culture + 0.4 * t.tech, "1.6": 0.5 * t.mgr + 0.5 * t.culture, "1.7": 0.5 * t.pay + 0.4 * t.culture, "1.8": 0.6 * t.team + 0.3 * t.culture, "1.9": 0.6 * t.team + 0.3 * t.culture, "1.10": 0.5 * t.mgr + 0.5 * t.culture }[q.number] ?? t.culture, { "1.1": -0.3, "1.2": 0, "1.3": -0.15, "1.4": 0.1, "1.5": 0.1, "1.6": -0.1, "1.7": -0.4, "1.8": 0.1, "1.9": 0.25, "1.10": -0.15 }[q.number] ?? 0],
  "SoftWE2.": (t, q) => [{ "2.1": 0.5 * t.job + 0.4 * t.homeEnv, "2.2": 0.6 * t.job + 0.3 * t.g, "2.3": t.team - 0.3, "2.4": t.job, "2.5": 0.6 * t.team + 0.4 * t.tech, "2.6": t.homeEnv }[q.number], 0.1],
  "SoftWE4.": (t) => [0.6 * t.mgr + 0.3 * t.culture, 0.2],
};
const driveOf = (q) => { if (DRIVE[q.id]) return DRIVE[q.id]; const k = Object.keys(DRIVE).find((p) => p.endsWith(".") && q.id.startsWith(p)); return k ? DRIVE[k] : null; };

/* Work environment: office and home are separate places (PhysWE1.x, SoftWE1.1-1.6). */
const PLACE = {
  PhysWE: (t, n, place) => [place === "home" ? t.homeEnv : t.env, { home: { "1.1": 0.3, "1.2": 0.2, "1.3": 0.4, "1.4": 0.1, "1.5": -0.45, "1.6": 0.5, "1.7": -0.35, "1.8": 0 }, office: { "1.1": 0.3, "1.2": -0.35, "1.3": -0.55, "1.4": 0.1, "1.5": 0.05, "1.6": 0.3, "1.7": 0.4, "1.8": 0.05 } }[place][n] ?? 0],
  SoftWE: (t, n, place, p) => [{ "1.1": t.culture + (p.workModel === "Office" ? -0.3 : 0.4), "1.2": place === "home" ? t.homeEnv : t.env - 0.2, "1.3": t.tech, "1.4": t.tech, "1.5": t.g, "1.6": place === "home" ? t.homeEnv - 0.1 : t.tech + 0.2 }[n], { "1.1": 0, "1.2": -0.25, "1.3": 0, "1.4": -0.2, "1.5": 0.1, "1.6": 0 }[n] ?? 0],
};

/* One person, one round → { answers, comments }. */
function answer(person, roundIndex) {
  CUR = person;
  const p = person.profile, sh = ROUND_SHIFT[roundIndex];
  // This round's traits: everyone's shift, plus a little personal drift.
  const t = Object.fromEntries(Object.entries(person.T).map(([k, v]) => [k, v + (sh[k] || 0) + 0.12 * randn()]));
  if (p.department === "Customer Services/Support" && roundIndex === 1) t.workload -= 0.3; // the round-2 crunch hit them hardest
  const A = {}, C = {};
  for (const q of questions) {
    if (q.section === "profile") continue;
    const id = q.id;
    // Who is asked.
    if (/^SoftWE2\./.test(id) && p.workModel === "Office") continue;
    if (id === "SoftWE3" && p.workModel !== "Hybrid") continue;
    if (/^SoftWE4\./.test(id) && !p.manager) continue;
    // Free text: a third of people write something.
    if (!q.scale && /free/i.test(q.design) && !q.options.length) { if (COMMENTS[id] && rand() < 0.3) C[id] = pick(COMMENTS[id]); continue; }
    // Special cases first.
    // Habits belong to the person: decided once, then mostly kept (a smoker may quit; drinking varies a little).
    if (id === "PHYS3") {
      if (person.smoke == null) { const r = rand() + 0.08 * person.T.phys; person.smoke = r > 0.3 ? 0 : r > 0.13 ? 1 : r > 0.07 ? 2 : r > 0.015 ? 3 : 4; } // None, Ex, <5, 5-20, >20
      else if (person.smoke >= 2 && rand() < 0.1) person.smoke = 1;
      A[id] = person.smoke; continue;
    }
    if (id === "PHYS4") {
      if (person.drinks == null) person.drinks = rand() < 0.18 ? 0 : Math.exp(1.6 + 0.6 * randn() - 0.15 * person.T.phys);
      A[id] = person.drinks === 0 ? 0 : Math.max(0, Math.round(person.drinks * Math.exp(0.15 * randn()))); continue;
    }
    if (id === "PHYS6") {
      const h = Math.round(p.gender === "Male" ? 177 + 7 * randn() : p.gender === "Female" ? 164 + 6.5 * randn() : 170 + 8 * randn());
      if (!person.bmi) person.bmi = clamp(26.2 - 1.6 * person.T.phys + 3.2 * randn(), 17.5, 41);
      const bmi = person.bmi + 0.4 * randn() + (roundIndex - 1) * 0.1;
      A[id] = [h, Math.round(bmi * (h / 100) ** 2 * 10) / 10]; continue;
    }
    if (id === "PHYS7") { if (person.chronic == null) person.chronic = rand() < 0.1 + Math.max(0, p.age - 40) * 0.012 - 0.04 * person.T.phys; A[id] = person.chronic ? 0 : 1; continue; } // Yes / No
    if (id === "PHYS8") { if (person.facilities == null) person.facilities = rand() < (person.siteInfo ? 0.55 + person.siteInfo.env * 0.4 : 0.3); A[id] = person.facilities ? 0 : 1; continue; }
    if (id === "PSY2.1") { A[id] = nearest(q.scores, clamp(100 - target(0.8 * t.mind + 0.2 * t.workload, id), 0, 100)); continue; } // agreeing = stress harming health
    if (/^MS1\./.test(id)) {
      // How often the manager uses each style. A good manager leans on the style the person's competence calls for.
      const comp = A["MS2.1"] ?? null;
      const fit = { "MS1.1": 0, "MS1.2": 1, "MS1.3": 2, "MS1.4": 3 }[id];
      const want = p.tenure === "Less than 1 year" ? 0 : ["1-3 years"].includes(p.tenure) ? 1 : ["3-5 years", "5-10 years"].includes(p.tenure) ? 2 : 3;
      const z = (fit === want ? 0.9 : Math.abs(fit - want) === 1 ? 0.1 : -0.6) * (0.5 + 0.5 * Math.tanh(t.mgr)) + 0.3 * randn() + (comp == null ? 0 : 0);
      A[id] = clamp(Math.round(2 - 1.4 * z + 0.6 * randn()), 0, 4); continue; // 0 = Most of the time … 4 = Never
    }
    if (id === "MS2.1") { const base = { "Less than 1 year": 0.4, "1-3 years": 1.3, "3-5 years": 1.9, "5-10 years": 2.2, "10-20 years": 2.5, "20+ years": 2.6 }[p.tenure]; A[id] = clamp(Math.round(base + 0.25 * t.job + 0.6 * randn()), 0, 3); continue; }
    if (id === "CC2.1") { A[id] = clamp(Math.round(6.4 + 1.5 * (0.5 * t.g + 0.3 * t.job + 0.3 * t.culture) + keepNoise("CC2.1", 0.9) + 0.5 * randn()), 0, 10); continue; }
    if (id === "CC2.2") { A[id] = clamp(Math.round(6.0 + 1.4 * (0.5 * t.team + 0.4 * t.culture) + keepNoise("CC2.2", 0.9) + 0.5 * randn()), 0, 10); continue; }
    if (id === "CC2.3") { A[id] = clamp(Math.round(7.2 + 1.7 * (0.5 * t.culture + 0.3 * t.job + 0.2 * t.g) + keepNoise("CC2.3", 1.0) + 0.55 * randn()), 0, 10); continue; }
    if (id === "SoftWE2.7") { const mins = (person.siteInfo?.commute ?? pick([30, 45, 60])) * (0.6 + 0.8 * rand()); A[id] = clamp(Math.floor(mins / 15), 0, 10); continue; }
    if (id === "SoftWE3") { A[id] = clamp(Math.round(1.6 - 0.6 * t.job - 0.4 * t.homeEnv + 0.8 * randn()), 0, 4); continue; } // Much more … Much less productive
    // N/A where it applies.
    const na = naIndex(id);
    if (na >= 0) {
      if ((id === "FOW1.2" || id === "PSY5.2") && !p.dependants) { A[id] = na; continue; }
      if (id === "FOW1.3" && p.workModel === "Home") { A[id] = na; continue; }
      if (id === "PSY5.1" && rand() < 0.06) { A[id] = na; continue; }
      if (id === "CC1.21" && (p.workModel === "Home" || rand() < 0.03)) { A[id] = na; continue; }
      if (id === "CC1.22" && rand() < (p.workModel === "Home" ? 0.25 : 0.03)) { A[id] = na; continue; }
    }
    if (id === "FOW1.3") { A[id] = listAnswer(id, -0.4 + 0.3 * t.life - (person.siteInfo?.commute ?? 40) / 60 + (p.workModel === "Hybrid" ? 0.5 : 0)); continue; }
    // Work environment: one answer per place the person works.
    const placeKey = /^PhysWE1\./.test(id) ? "PhysWE" : /^SoftWE1\.[1-6]$/.test(id) ? "SoftWE" : null;
    if (placeKey) {
      const one = (place) => { const [z, b] = PLACE[placeKey](t, q.number, place, p); return listAnswer(id, z + b, `${id}:${place}`); };
      A[id] = p.workModel === "Hybrid" ? [one("office"), one("home")] : one(p.workModel === "Home" ? "home" : "office");
      continue;
    }
    // Everything else: its traits, its difficulty.
    const drive = driveOf(q);
    if (!drive) continue;
    const [z, b] = drive(t, q);
    if (q.options.length) A[id] = listAnswer(id, z + b);
    else if (q.scale === "oneFive") A[id] = clamp(Math.round(3.4 + 0.9 * (z + b) + keepNoise(id, 0.5) + 0.3 * randn()), 1, 5);
  }
  // HPQ (Your Profile Q16): asked every round.
  A["PRO16.1"] = clamp(Math.round(7 + keepNoise("PRO16.1", 1.0) + 0.4 * randn()), 2, 10);
  A["PRO16.2"] = clamp(Math.round(7.3 + 0.8 * t.job + 0.3 * t.g + keepNoise("PRO16.2", 0.8) + 0.4 * randn()), 2, 10);
  A["PRO16.3"] = clamp(Math.round(A["PRO16.2"] - 0.3 + 0.5 * t.mind + 0.3 * t.workload + 0.8 * randn()), 1, 10);
  return { answers: A, comments: C };
}

/* Who answered each round: everyone employed then, minus a few who didn't respond. */
for (const person of people) {
  person.responses = [];
  ROUNDS.forEach((r, ri) => {
    if (ri < person.joinedRound) return;
    if (rand() < (ri === 0 ? 0.1 : ri === 1 ? 0.08 : 0.05)) return;
    const { answers, comments } = answer(person, ri);
    person.responses.push({ round: r.id, answers, ...(Object.keys(comments).length ? { comments } : {}) });
  });
}

/* ---- write ---------------------------------------------------------- */
const out = {
  meta: {
    surveyId: SURVEY.id, seed: SEED, people: N, generatedAt: new Date().toISOString().slice(0, 10),
    rounds: ROUNDS.map((r, ri) => ({ ...r, invited: people.filter((p) => p.joinedRound <= ri).length })),
    sites: SITES.map(({ code, name, country, currency }) => ({ code, name, country, currency })),
    notCollected: { PRO7: "Ethnicity: the lists per country are still to come (survey issue I15), so this client has it turned off." },
    proposed: { salary: "Annual salary is an amount in the local currency; the bands per country are still to come (I15)." },
    story: "Round 2: workload bites everywhere, hardest in Customer Services/Support. Round 3: a manager programme and a workload review land; manager and culture scores lift, stress eases.",
  },
  people: people.map(({ id, profile, responses }) => ({ id, profile: Object.fromEntries(Object.entries(profile).filter(([, v]) => v !== undefined)), responses })),
};
fs.writeFileSync(OUT, JSON.stringify(out));

/* ---- checks (with the product's own scoring) ------------------------- */
const r0 = (x) => Math.round(x * 10) / 10;
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const pearson = (a, b) => { const ma = avg(a), mb = avg(b); let n = 0, da = 0, db = 0; a.forEach((x, i) => { n += (x - ma) * (b[i] - mb); da += (x - ma) ** 2; db += (b[i] - mb) ** 2; }); return n / Math.sqrt(da * db); };
console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
ROUNDS.forEach((r) => {
  const rs = people.map((p) => ({ p, res: p.responses.find((x) => x.round === r.id) })).filter((x) => x.res).map((x) => ({ ...x, sc: scoreResponse(SURVEY, x.res.answers, x.p.profile) }));
  const ov = rs.map((x) => x.sc.overall);
  const st = { Flourishing: 0, Striving: 0, Struggling: 0 }; rs.forEach((x) => st[x.sc.status]++);
  const ex = SURVEY.sections.filter((x) => x.kind === "explorer").map((e) => `${e.name.split(" ").map((w) => w[0]).join("")} ${Math.round(avg(rs.map((x) => x.sc.explorers[e.id])))}`).join(" · ");
  console.log(`${r.label}: ${rs.length} answered · overall ${r0(avg(ov))} (sd ${r0(Math.sqrt(avg(ov.map((v) => (v - avg(ov)) ** 2))))}) · ${st.Flourishing}F/${st.Striving}S/${st.Struggling}T · eNPS ${enpsOf(rs.map((x) => x.res.answers["CC2.3"]))}`);
  console.log(`   ${ex}`);
  if (r.id === "r3") {
    const d = (k) => rs.map((x) => x.sc.drivers[k] ?? 50);
    console.log(`   r(Sleep, Stress) ${r0(pearson(d("Sleep"), d("Stress")))} · r(Workload, Work-life balance) ${r0(pearson(d("Workload"), d("Work-life balance")))} · r(Relationship with manager, Role clarity) ${r0(pearson(d("Relationship with manager"), d("Role clarity")))}`);
    const byDept = {}; rs.forEach((x) => (byDept[x.p.profile.department] = byDept[x.p.profile.department] || []).push(x.sc.overall));
    console.log(`   ${Object.entries(byDept).sort((a, b) => avg(a[1]) - avg(b[1])).map(([k, v]) => `${k.split(/[ /]/)[0]} ${Math.round(avg(v))}`).join(" · ")}`);
    const wm = {}; rs.forEach((x) => (wm[x.p.profile.workModel] = (wm[x.p.profile.workModel] || 0) + 1)); console.log(`   work model ${JSON.stringify(wm)} · BMI ${r0(avg(rs.map((x) => bmiOf(x.res.answers.PHYS6))))}`);
    const wb = {}; rs.forEach((x) => Object.entries(x.sc.wellbeing).forEach(([k, v]) => { wb[k] = wb[k] || {}; wb[k][v.level] = (wb[k][v.level] || 0) + 1; })); console.log(`   ${JSON.stringify(wb)}`);
  }
});
