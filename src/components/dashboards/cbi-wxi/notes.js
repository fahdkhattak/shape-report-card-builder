/* What changed on each page, and how to build it in Power BI with native visuals only. */
export const GLOBAL_NOTES = {
  changed: [
    "The 230px filter sidebar is gone: filters sit in one slicer bar under the header, so every page gets the full width.",
    "Pages are tabs in the header (page navigator), in story order: Overview, Actions, Evidence, Departments, Driver. Action detail is a drill-through page, not a tab.",
    "One status palette on every page: Struggling red (under 60), Striving amber (60 to 79), Flourishing green (80+). Navy is only for structure and selection.",
    "Every number shown once. No bar plus the same number beside it, no boxes repeating a chart.",
  ],
  build: [
    "Page size 16:9, 1280 × 720. Report theme JSON with the colours below and Segoe UI (Power BI's default; custom fonts don't travel to the Service).",
    "Header: a rectangle shape, a text box with the title, and the Page navigator (Insert › Buttons › Navigator) styled from the theme.",
    "Slicer bar: dropdown slicers with sync slicers on, so a filter set on one page holds on the others. Reset = a bookmark button that clears all slicers.",
    "Visual containers: background white, border #E2E5EC, rounded corners 8, no shadow. Titles on, 13pt semibold; subtitles carry the one-line explanation.",
    "Status colours come from one measure per visual (Status Colour = SWITCH on the score) used in conditional formatting › Field value.",
  ],
};

export const PAGE_NOTES = {
  overview: {
    changed: [
      "The WXI wheel stays (it's the report's signature), cleaned up: the seven topics are tinted by status with the score inside, the two pillars sit in the inner ring, and the index in the centre. Selecting a topic filters the Driver scores.",
      "Health Age keeps its place. It shows the Site's average Health Age against actual age when the client has asked for it, and a quiet Not requested state when not (use the Health Age requested switch above to see both).",
      "Six small cards became three: Drivers by status, Who answered (people, gender, work location, tenure) and Health Age.",
      "Driver scores are sorted lowest first, with dashed lines at 60 and 80.",
    ],
    build: [
      "Wheel: an SVG measure (DAX builds the SVG string; show it in an Image visual or a Table with Image URL) needs no custom visual. For click-to-filter use Deneb, or a transparent button over each topic segment that sets a Topic slicer (bookmarks).",
      "Health Age: Card (new) bound to a Health Age measure; a client flag measure returns blank when not requested, and the card's 'show blank as' text reads Not requested.",
      "Drivers by status: Card (new) with three callouts plus a 100% stacked bar.",
      "Who answered: Card, 100% stacked bar (gender), Card (hybrid %), Column chart (tenure).",
      "Driver scores: Clustered bar chart, sorted ascending, bar colour by Status Colour, constant lines at 60 and 80, scrollbar on; filtered by the topic selection.",
    ],
  },
  actions: {
    changed: [
      "One tile per kind of action instead of one long table: Do now, Plan next, Raise with CBI, Nudge staff, each with when and who in its subtitle.",
      "The page opens with what to do first, in one sentence.",
      "The index sits on the left, so the actions always read against the score they move.",
      "Each action shows its score, what to do and who does it; selecting it opens the plan (Action detail).",
      "Raise with CBI shows its three lowest-scoring actions; See all expands to the eight.",
      "A Struggling / Striving / Flourishing toggle switches the tiles to what's within reach or what's working well; The balance shows all three at once.",
    ],
    build: [
      "Headline: a text box with a dynamic value from a measure.",
      "Status toggle: three buttons and bookmarks (one per state), or a Button slicer on a Status table driving which visuals show.",
      "Overall WXI: Card (new) with the status as a reference label, and two text callouts for the pillars.",
      "Each action tile: a Table with headers and gridlines off, filtered to its owner group; Score with background conditional formatting (Status Colour, light), Driver and action stacked in one column (word wrap on), Who as a third column. Tile title and subtitle are the visual's title and subtitle.",
      "Opening the plan: a Drill-through button in each tile (or right-click › Drill through) to Action detail.",
      "See all 8: a bookmark that swaps the top-3 table (Top N filter) for the full one.",
      "The balance: 100% stacked bar with data labels.",
    ],
  },
  detail: {
    changed: [
      "Five answer boxes and three status boxes became one stacked bar with a legend and the three status shares under it.",
      "Who is most affected is a bar chart with the Site's score as a line, so the gap is visible, not just a −24 in a column.",
      "The plan reads in order: why, the quick win, the bigger fix, then how we'll know it worked.",
      "The empty Related signal box is gone: show it only for the Drivers that have a home-vs-work comparison.",
    ],
    build: [
      "Drill-through page on Driver, with the built-in Back button.",
      "Header: text boxes bound to measures (owner, topic, question) and a Card for the score.",
      "How people answered: 100% stacked bar, Answer as legend, colours set per answer in the theme.",
      "Who is most affected: Clustered bar chart of the group score measure, constant line = Site score (from a measure), group type in the tooltip.",
      "The plan: four text boxes or one Card (new) with four callouts bound to the plan fields. Hide Related signal with a measure that returns blank, and a card set to show nothing for blank.",
    ],
  },
  evidence: {
    changed: [
      "The heat map is shaded by how far each cell is above the Site's own rate for that Driver, not by the raw percentage, so the real hot spots stand out instead of the whole grid being red.",
      "A Site row sits at the top of the heat map as the reference.",
      "The page opens with its finding in one sentence.",
      "Evidence & Progress is renamed Evidence: there's no progress data yet. A note says progress appears from the next pulse.",
    ],
    build: [
      "Headline: a text box with a dynamic value (or Smart narrative) from a measure.",
      "Hot spots: Matrix, Department on rows, Driver on columns, % Struggling as values; background colour by rules on a Gap vs Site measure (1-4, 5-9, 10-14, 15+); Site as a total row moved to the top, or a separate one-row matrix above.",
      "What makes the difference: Clustered bar chart.",
      "What staff told us: Card (new) with four callouts.",
      "Working well: Table with the score coloured by Status Colour.",
    ],
  },
  department: {
    changed: [
      "The Driver table is sorted by the gap with the Site, so the biggest problems come first; before, it was sorted by the department's own %, which buried a +24 gap halfway down.",
      "Gap is colour-coded: red at 10+ points worse, green when better.",
      "Struggling-across-the-Site Drivers are marked, so Biggest gap is explained.",
      "The league table highlights the selected department and its rank.",
      "What to raise sits beside the table and each row opens the Driver's plan.",
    ],
    build: [
      "Department: a single-select dropdown slicer, emphasised in the slicer bar (sync it with the other pages' Department slicer).",
      "KPI row: Card (new), five callouts.",
      "Differs from the Site: Table; This department with data bars; Gap with background colour by rules; sorted by Gap descending.",
      "League table: Table with data bars coloured by a rule (above Site avg red, else grey) and the selected row highlighted with a Is Selected measure in background colour.",
      "What to raise: Table (or Card (new) with a category) filtered to Top 4 by gap, with drill-through to Action detail.",
    ],
  },
  driver: {
    changed: [
      "Three breadcrumb cards with arrows became one line: pillar › topic › Driver, each with its score.",
      "The donut became a 100% stacked bar, matching the Action detail page.",
      "Answer columns are coloured by the status each answer counts towards, so the chart and the status split agree.",
      "Eight gauges became four range rows: for each way of grouping, the lowest and highest group on one line, with the gap.",
      "Recommended actions are shown in full (the source cut the third one off).",
    ],
    build: [
      "Driver: single-select dropdown slicer in the slicer bar.",
      "Breadcrumb: a text box with dynamic values from measures.",
      "Status split: 100% stacked bar.",
      "How people answered: Clustered column chart, colours per answer.",
      "Highest and lowest: a stacked bar with a transparent first segment (the lowest score) and the range as the second, dots via error bars or a scatter overlay; or, simplest, a Table with lowest, highest and gap columns.",
      "Other Drivers in the topic: Clustered bar chart filtered to the selected Driver's topic.",
      "Recommended actions: Table or Card (new) with word wrap on.",
    ],
  },
};

export const THEME_SWATCHES = [
  ["Navy (structure)", "#24317E"], ["Page", "#EEF0F4"], ["Border", "#E2E5EC"], ["Text", "#1E2230"],
  ["Struggling", "#D2495A"], ["Striving", "#EDA93A"], ["Flourishing", "#3A9B66"],
];
