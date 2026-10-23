import { useRounds } from "../../../lib/roundsContext.js";
import { LAST, fmtMonth } from "../../../lib/scopeData.js";
import { ScoreLine } from "./TrendCharts.jsx";

/* ================================================================== */
/* HISTORY LINE CHART — one measure across rounds, used where a Story    */
/* opens a part's own history (a Score History row, the single-line       */
/* Trend Story). It is the Trend family's line chart (ScoreLine in         */
/* TrendCharts.jsx) with the dataset's rounds, so every line graph in      */
/* the product looks and responds the same way: it draws at the width it   */
/* is given, 11 to 12px text, status-coloured values, latest round bold.   */
/* (It used to be its own 776px picture scaled down, which made its text   */
/* tiny on a phone and didn't match the other charts.)                     */
/* ================================================================== */
export default function HistoryLineChart({ values, banded = true, domain = [0, 100], ticks = [0, 20, 40, 60, 80, 100], unit = "" }) {
  const ROUND_LABELS = useRounds().map((r, i) => ({ label: fmtMonth(r.date), latest: i === LAST }));
  return <ScoreLine rounds={ROUND_LABELS} values={values} domain={domain} ticks={[...ticks].sort((a, b) => b - a)} banded={banded} unit={unit} />;
}
