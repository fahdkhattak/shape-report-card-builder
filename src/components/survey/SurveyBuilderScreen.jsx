import { useState } from "react";
import { font } from "../../lib/tokens.js";
import SurveyBuilderV1 from "./SurveyBuilderV1.jsx";
import SurveyBuilderV2 from "./SurveyBuilderV2.jsx";
import SurveyBuilderV3 from "./SurveyBuilderV3.jsx";
import SurveyBuilderV4 from "./SurveyBuilderV4.jsx";
import SurveyBuilderV5 from "./SurveyBuilderV5.jsx";

const VERSION_KEY = "survey-builder-version";
const SCREENS = { v1: SurveyBuilderV1, v2: SurveyBuilderV2, v3: SurveyBuilderV3, v4: SurveyBuilderV4, v5: SurveyBuilderV5 };

/* ================================================================== */
/* SURVEY BUILDER SCREEN — version switcher. Mounts one of three          */
/* independent, self-contained prototypes (each owns its own NavRail       */
/* render, header, and `localStorage`-saved blueprint under its own key     */
/* — see each file's own header comment for why they aren't sharing one      */
/* data model). No longer renders any chrome of its own — an earlier         */
/* version had a separate frosted strip above the mounted screen holding      */
/* the version picker; per explicit direction that's gone, and each          */
/* version's own header now renders `VersionSwitcher.jsx` directly next to    */
/* its own Preview button instead. Picking a version is still remembered      */
/* (`localStorage`) so re-opening Survey Builder returns to whichever you      */
/* were comparing last.                                                        */
/* ================================================================== */
export default function SurveyBuilderScreen(props) {
  const [version, setVersion] = useState(() => {
    try { return localStorage.getItem(VERSION_KEY) || "v2"; } catch { return "v2"; }
  });

  const setAndSaveVersion = (v) => {
    setVersion(v);
    try { localStorage.setItem(VERSION_KEY, v); } catch { /* private-browsing/storage-disabled */ }
  };

  const Screen = SCREENS[version] ?? SurveyBuilderV2;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: font }}>
      <Screen {...props} version={version} onVersionChange={setAndSaveVersion} />
    </div>
  );
}
