"use client";

import { useState } from "react";
import { BUDGETS, SERVICES, TIMELINES, blueprintSchema } from "@/lib/schema";

type FormState = {
  service: string; industry: string; budget: string; timeline: string;
  name: string; email: string; company: string; description: string;
};

const EMPTY: FormState = {
  service: "", industry: "", budget: "", timeline: "",
  name: "", email: "", company: "", description: "",
};

const STEP_FIELDS: string[][] = [
  ["service"],
  ["industry", "budget", "timeline"],
  ["name", "email", "company", "description"],
];
const STEP_TITLES = ["What do you need?", "Scope & timing", "About you"];

function validateStep(data: FormState, step: number) {
  const result = blueprintSchema.safeParse(data);
  const errors: Record<string, string> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (STEP_FIELDS[step].includes(key) && !errors[key]) errors[key] = issue.message;
    }
  }
  return errors;
}

function OptionGroup({
  options, value, onChange,
}: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            value === opt
              ? "border-teal-800 bg-teal-800 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:border-teal-700"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function BlueprintForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (value: string) =>
    setData((d) => ({ ...d, [key]: value }));

  const next = () => {
    const errs = validateStep(data, step);
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep((s) => s + 1);
  };

  const submit = async () => {
    const errs = validateStep(data, 2);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setServerError(null);
    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setBrief(json.brief);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(EMPTY); setBrief(null); setErrors({}); setStep(0);
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-700 focus:outline-none";
  const Err = ({ k }: { k: string }) =>
    errors[k] ? <p className="mt-1 text-sm text-red-600">{errors[k]}</p> : null;

  if (brief) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold text-teal-900">Your Project Blueprint</h2>
        <div className="mt-4 whitespace-pre-wrap text-slate-800">{brief}</div>
        <button onClick={reset} className="mt-6 rounded-full border border-teal-800 px-5 py-2 text-teal-800">
          Start a new blueprint
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-800">
        Step {step + 1} of 3
      </p>
      <h2 className="mt-1 text-2xl font-semibold text-slate-900">{STEP_TITLES[step]}</h2>
      <div className="mt-3 h-1.5 w-full rounded bg-slate-200">
        <div className="h-1.5 rounded bg-teal-800 transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>

      <div className="mt-6 space-y-5">
        {step === 0 && (
          <div>
            <OptionGroup options={SERVICES} value={data.service} onChange={set("service")} />
            <Err k="service" />
          </div>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">Industry (optional)</label>
              <input className={inputCls} value={data.industry} onChange={(e) => set("industry")(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Budget</label>
              <OptionGroup options={BUDGETS} value={data.budget} onChange={set("budget")} />
              <Err k="budget" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Timeline</label>
              <OptionGroup options={TIMELINES} value={data.timeline} onChange={set("timeline")} />
              <Err k="timeline" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">Full name</label>
              <input className={inputCls} value={data.name} onChange={(e) => set("name")(e.target.value)} />
              <Err k="name" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input type="email" className={inputCls} value={data.email} onChange={(e) => set("email")(e.target.value)} />
              <Err k="email" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Company (optional)</label>
              <input className={inputCls} value={data.company} onChange={(e) => set("company")(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">What are you building?</label>
              <textarea rows={5} className={inputCls} value={data.description} onChange={(e) => set("description")(e.target.value)} />
              <Err k="description" />
            </div>
          </>
        )}
      </div>

      {serverError && <p className="mt-4 text-sm text-red-600">{serverError}</p>}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0 || loading}
          className="rounded-full px-5 py-2 text-slate-600 disabled:invisible"
        >
          Back
        </button>
        {step < 2 ? (
          <button type="button" onClick={next} className="rounded-full bg-teal-800 px-6 py-2 text-white">
            Next
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={loading} className="rounded-full bg-teal-800 px-6 py-2 text-white disabled:opacity-60">
            {loading ? "Generating your blueprint…" : "Generate my blueprint"}
          </button>
        )}
      </div>
    </section>
  );
}