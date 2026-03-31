import { z } from "zod";
import {
  supabase,
  type Experience,
  type ExperienceFormData,
} from "../lib/supabase";

export type { Experience, ExperienceFormData };

const ensureSupabaseEnv = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.",
    );
  }
};

const ExperienceFormSchema = z.object({
  id: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().optional().nullable(),
  company_url: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().nullable(),
  is_present: z.boolean().optional().default(false),
  achievements: z.array(z.string()).default([]),
});

const normalizeExperience = (row: any): Experience => {
  return {
    ...row,
    location: row?.location ?? null,
    company_url: row?.company_url ?? null,
    end_date: row?.end_date ?? null,
    achievements: Array.isArray(row?.achievements) ? row.achievements : [],
  } as Experience;
};

export async function fetchExperiences() {
  ensureSupabaseEnv();
  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .order("order_index", { ascending: true })
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data as Experience[] | null)?.map(normalizeExperience) || [];
}

export async function createExperience(input: { data: ExperienceFormData }) {
  ensureSupabaseEnv();
  const parsed = ExperienceFormSchema.parse(input.data);
  const payload = {
    position: parsed.position,
    company: parsed.company,
    location: parsed.location || null,
    company_url: parsed.company_url || null,
    start_date: parsed.start_date,
    end_date: parsed.is_present ? null : parsed.end_date || null,
    is_present: parsed.is_present ?? false,
    achievements: parsed.achievements ?? [],
  };

  const { data, error } = await supabase
    .from("experiences")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return normalizeExperience(data);
}

export async function updateExperience(input: { data: ExperienceFormData }) {
  ensureSupabaseEnv();
  const parsed = ExperienceFormSchema.parse(input.data);
  if (!parsed.id) throw new Error("Experience ID is required for update");

  const payload = {
    position: parsed.position,
    company: parsed.company,
    location: parsed.location || null,
    company_url: parsed.company_url || null,
    start_date: parsed.start_date,
    end_date: parsed.is_present ? null : parsed.end_date || null,
    is_present: parsed.is_present ?? false,
    achievements: parsed.achievements ?? [],
  };

  const { data, error } = await supabase
    .from("experiences")
    .update(payload)
    .eq("id", parsed.id)
    .select()
    .single();
  if (error) throw error;
  return normalizeExperience(data);
}

export async function deleteExperience(input: { data: { id: string } }) {
  ensureSupabaseEnv();
  const { id } = input.data;
  if (!id) throw new Error("Experience ID is required");
  const { error } = await supabase.from("experiences").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}
