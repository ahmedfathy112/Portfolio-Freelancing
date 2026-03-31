import { z } from "zod";
import {
  supabase,
  type Certificate,
  type CertificateFormData,
} from "../lib/supabase";

export type { Certificate, CertificateFormData };

const ensureSupabaseEnv = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.",
    );
  }
};

const CertificateFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date_issued: z.string().min(1, "Date is required"),
  certificate_url: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  description: z.array(z.string()).default([]),
});

const normalizeCertificate = (row: any): Certificate => {
  return {
    ...row,
    certificate_url: row?.certificate_url ?? null,
    description: Array.isArray(row?.description) ? row.description : [],
  } as Certificate;
};

export async function fetchCertificates() {
  ensureSupabaseEnv();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("order_index", { ascending: true })
    .order("date_issued", { ascending: false });
  if (error) throw error;
  return (data as Certificate[] | null)?.map(normalizeCertificate) || [];
}

export async function createCertificate(input: { data: CertificateFormData }) {
  ensureSupabaseEnv();
  const parsed = CertificateFormSchema.parse(input.data);
  const payload = {
    title: parsed.title,
    issuer: parsed.issuer,
    date_issued: parsed.date_issued,
    certificate_url: parsed.certificate_url || null,
    description: parsed.description ?? [],
  };

  const { data, error } = await supabase
    .from("certificates")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return normalizeCertificate(data);
}

export async function updateCertificate(input: { data: CertificateFormData }) {
  ensureSupabaseEnv();
  const parsed = CertificateFormSchema.parse(input.data);
  if (!parsed.id) throw new Error("Certificate ID is required for update");

  const payload = {
    title: parsed.title,
    issuer: parsed.issuer,
    date_issued: parsed.date_issued,
    certificate_url: parsed.certificate_url || null,
    description: parsed.description ?? [],
  };

  const { data, error } = await supabase
    .from("certificates")
    .update(payload)
    .eq("id", parsed.id)
    .select()
    .single();
  if (error) throw error;
  return normalizeCertificate(data);
}

export async function deleteCertificate(input: { data: { id: string } }) {
  ensureSupabaseEnv();
  const { id } = input.data;
  if (!id) throw new Error("Certificate ID is required");
  const { error } = await supabase.from("certificates").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}
