import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
// Uses env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export interface Project {
  id: string;
  title: string;
  description: string;
  github_url: string;
  linkedin_url: string;
  skills: string[];
  image_url: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectFormData {
  id?: string;
  title: string;
  description: string;
  github_url: string;
  linkedin_url: string;
  skills: string[];
  image_url?: string[];
  image_files?: File[];
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date_issued: string; // ISO date string
  certificate_url: string | null;
  description: string[];
  order_index?: number;
  created_at?: string;
}

export interface CertificateFormData {
  id?: string;
  title: string;
  issuer: string;
  date_issued: string;
  certificate_url?: string | null;
  description: string[];
}

export interface Experience {
  id: string;
  position: string;
  company: string;
  location: string | null;
  company_url: string | null;
  start_date: string; // ISO date string
  end_date: string | null;
  is_present: boolean;
  achievements: string[];
  order_index?: number;
  created_at?: string;
}

export interface ExperienceFormData {
  id?: string;
  position: string;
  company: string;
  location?: string | null;
  company_url?: string | null;
  start_date: string;
  end_date?: string | null;
  is_present?: boolean;
  achievements: string[];
}
