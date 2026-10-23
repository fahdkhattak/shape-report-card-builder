import { createContext, useContext } from "react";
import { ROUNDS as DATASET_ROUNDS } from "./dataset.js";

/* The rounds a Story's dates and round names come from: `[{ round, date }]`, oldest first. Defaults to the original
   dataset (lib/dataset.js), so the existing reports are unchanged; the SHAPE reports (new survey dataset) provide
   their own rounds around their Scope. Both datasets have three rounds, so LAST (an index) agrees. */
export const RoundsContext = createContext(DATASET_ROUNDS);
export const useRounds = () => useContext(RoundsContext);
