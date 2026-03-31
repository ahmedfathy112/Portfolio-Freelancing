import { z } from "zod";
import { supabase, type CvLink, type CvLinkFormData } from "../lib/supabase";

export type { CvLink, CvLinkFormData };

const ensureSupabaseEnv = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.",
    );
  }
};

const CvLinkSchema = z.object({
  url: z.string().url("Invalid CV URL"),
});

export async function fetchCvLink() {
  ensureSupabaseEnv();
  const { data, error } = await supabase
    .from("cv_links")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data as CvLink | null) ?? null;
}

export async function upsertCvLink(input: { data: CvLinkFormData }) {
  ensureSupabaseEnv();
  const parsed = CvLinkSchema.parse(input.data);
  const payload = {
    id: 1,
    url: parsed.url,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("cv_links")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data as CvLink;
}
