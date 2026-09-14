const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const dataset = JSON.parse(fs.readFileSync(path.join(__dirname, "dataset.json"), "utf8"));
const { users, orgSummaries, meta } = dataset;

const wb = XLSX.utils.book_new();

// --- Users (demographics) ---
const usersRows = users.map((u) => ({
  ID: u.id, "First Name": u.firstName, "Last Name": u.lastName, Gender: u.gender,
  Department: u.department, "Job Level": u.jobLevel, Location: u.location,
  Tenure: u.tenure, "Employment Status": u.employmentStatus, "Work Model": u.workModel,
}));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersRows), "Users");

// --- Overall (wide: one row per user-round) ---
const overallRows = [];
users.forEach((u) => {
  u.rounds.forEach((r) => {
    overallRows.push({
      ID: u.id, Name: `${u.firstName} ${u.lastName}`, Department: u.department, Gender: u.gender, "Work Model": u.workModel,
      Round: r.round, Date: r.date, "Overall Score": r.overallScore, Status: r.status,
      "Recommend (0-10)": r.recommendScore, "Morale (0-10)": r.morale, "Peer Morale (0-10)": r.peerMorale,
      ...Object.fromEntries(meta.dimensions.map((dim) => [dim, r.dimensionScores[dim]])),
    });
  });
});
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overallRows), "Overall");

// --- Driver scores (tidy/long format — one row per user-round-driver, good for pivoting) ---
const driverRows = [];
users.forEach((u) => {
  u.rounds.forEach((r) => {
    Object.entries(r.driverScores).forEach(([driver, val]) => {
      driverRows.push({ ID: u.id, Round: r.round, Date: r.date, Dimension: meta.driverDimensionMap[driver], Driver: driver, Score: val });
    });
  });
});
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(driverRows), "DriverScores (tidy)");

// --- Org summary ---
const orgRows = orgSummaries.map((s) => ({
  Round: s.round, Date: s.date, "Avg Overall Score": s.avgOverall, eNPS: s.eNPS,
  Flourishing: s.flourishing, Striving: s.striving, Struggling: s.struggling, "Avg Morale": s.avgMorale,
  ...Object.fromEntries(meta.dimensions.map((dim) => [dim, s.dimensionAvg[dim]])),
}));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orgRows), "OrgSummary");

// --- Driver -> Dimension map (reference) ---
const mapRows = Object.entries(meta.driverDimensionMap).map(([driver, dim]) => ({ Driver: driver, Dimension: dim }));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapRows), "Driver-Dimension Map");

const outPath = path.join(__dirname, "SHAPE_Survey_Dataset.xlsx");
XLSX.writeFile(wb, outPath);
console.log("Wrote", outPath);
