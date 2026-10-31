import { NextResponse } from "next/server";
import { blueprintSchema } from "@/lib/schema";
import { generateBrief } from "@/lib/brief";
import { rateLimit } from "@/lib/rateLimit";
import { saveLead } from "@/lib/leads";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = blueprintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { brief, source } = await generateBrief(parsed.data);
  const leadId = await saveLead(parsed.data, brief, source);

  return NextResponse.json({ brief, source, leadId });
}