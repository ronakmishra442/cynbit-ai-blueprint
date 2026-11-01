import type { BlueprintInput } from "./schema";

export type Priority = "hot" | "warm" | "cold";

const BUDGET_SCORE: Record<string, number> = {
  "Under ₹50k": 0,
  "₹50k – ₹2L": 1,
  "₹2L – ₹10L": 2,
  "₹10L+": 2,
  "Not sure yet": 0,
};

const TIMELINE_SCORE: Record<string, number> = {
  "ASAP (< 1 month)": 2,
  "1–3 months": 2,
  "3–6 months": 1,
  Flexible: 0,
};

export function scoreLead(i: BlueprintInput): { priority: Priority; reason: string } {
  const score =
    (BUDGET_SCORE[i.budget] ?? 0) +
    (TIMELINE_SCORE[i.timeline] ?? 0) +
    (i.description.length >= 200 ? 1 : 0) +
    (i.company ? 1 : 0);
  const priority: Priority = score >= 4 ? "hot" : score >= 2 ? "warm" : "cold";
  return {
    priority,
    reason: `Rule-based score ${score}/6 from budget, timeline, detail and company info.`,
  };
}