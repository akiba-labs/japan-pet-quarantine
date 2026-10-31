/** Verdict labels and colours, shared by server pages and the client calculator. */
export const VERDICT_STYLE: Record<string, string> = {
  on_track: "text-teal-200",
  plan: "text-amber-200",
  quarantine_risk: "text-amber-200",
  deadline_passed: "text-red-300",
  redo_required: "text-red-300",
};
export const VERDICT_LABEL: Record<string, string> = {
  on_track: "On track",
  plan: "Plan",
  quarantine_risk: "Detention risk",
  deadline_passed: "Deadline passed",
  redo_required: "Fix a step",
};
