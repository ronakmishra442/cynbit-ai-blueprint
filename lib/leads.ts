import { getSupabase } from "./supabase";
import type { BlueprintInput } from "./schema";

export async function saveLead(
  input: BlueprintInput,
  brief: string,
  briefSource: string
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      service: input.service,
      industry: input.industry || null,
      budget: input.budget,
      timeline: input.timeline,
      name: input.name,
      email: input.email,
      company: input.company || null,
      description: input.description,
      brief,
      brief_source: briefSource,
    })
    .select("id")
    .single();

  if (error) {
    console.error("saveLead failed:", error.message);
    return null;
  }
  return data.id as string;
}