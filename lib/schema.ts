import { z } from "zod";

export const SERVICES = ["AI Automation", "Web Development", "Mobile App", "Cloud & DevOps", "Technical SEO"] as const;
export const BUDGETS = ["Under ₹50k", "₹50k – ₹2L", "₹2L – ₹10L", "₹10L+", "Not sure yet"] as const;
export const TIMELINES = ["ASAP (< 1 month)", "1–3 months", "3–6 months", "Flexible"] as const;

export const blueprintSchema = z.object({
  service: z.enum(SERVICES, { message: "Please choose one" }),
  industry: z.string().trim().max(80).optional(),
  budget: z.enum(BUDGETS, { message: "Please choose one" }),
  timeline: z.enum(TIMELINES, { message: "Please choose one" }),
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
  company: z.string().trim().max(120).optional(),
  description: z.string().trim().min(20, "Please write at least 20 characters").max(1500),
});

export type BlueprintInput = z.infer<typeof blueprintSchema>;