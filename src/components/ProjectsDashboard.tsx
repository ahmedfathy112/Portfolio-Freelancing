import { useState, useEffect } from "react";
import type React from "react";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectImage,
  type Project,
  type ProjectFormData,
} from "../server/projects.functions.ts";
import {
  fetchExperiences,
  createExperience,
  deleteExperience,
  updateExperience,
} from "../server/experiences.functions";
import {
  fetchCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "../server/certificates.functions";
import ProjectForm from "./ProjectForm";
import ProjectGrid from "./ProjectGrid";
import { useNotification } from "../lib/useNotification";
import { cn } from "../lib/utils";

type ExperienceEntry = {
  id?: string;
  position: string;
  company: string;
  location: string;
  website: string;
  startDate: string;
  endDate: string | null;
  isPresent: boolean;
  achievements: string[];
};

type CertificationEntry = {
  id?: string;
  title: string;
  issuer: string;
  date: string;
  url: string;
  description: string;
};

type ExperienceFormState = ExperienceEntry & {
  achievementInput: string;
};

export default function ProjectsDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpLoading, setIsExpLoading] = useState(true);
  const [isCertLoading, setIsCertLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExperienceFormOpen, setIsExperienceFormOpen] = useState(false);
  const [isCertFormOpen, setIsCertFormOpen] = useState(false);
  const [isExpSubmitting, setIsExpSubmitting] = useState(false);
  const [isCertSubmitting, setIsCertSubmitting] = useState(false);
  const [editingExperience, setEditingExperience] =
    useState<ExperienceEntry | null>(null);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>(
    [],
  );
  const [experienceForm, setExperienceForm] = useState<ExperienceFormState>({
    position: "",
    company: "",
    location: "",
    website: "",
    startDate: "",
    endDate: "",
    isPresent: false,
    achievements: [],
    achievementInput: "",
  });
  const [certForm, setCertForm] = useState<CertificationEntry>({
    title: "",
    issuer: "",
    date: "",
    url: "",
    description: "",
  });
  const [editingCertificate, setEditingCertificate] =
    useState<CertificationEntry | null>(null);
  const { notification, showNotification, clearNotification } =
    useNotification();

  // Fetch projects on mount
  useEffect(() => {
    loadProjects();
    loadExperiences();
    loadCertificates();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProjects();
      const safeProjects = (data || []).filter((p): p is Project =>
        Boolean(p && p.id),
      );
      if (safeProjects.length !== (data || []).length) {
        console.warn(
          "Some projects were skipped because they were missing an id:",
          data,
        );
      }
      setProjects(safeProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      // Set empty array so component doesn't crash
      setProjects([]);
      showNotification(
        error instanceof Error
          ? error.message
          : "Failed to load projects. Check your Supabase configuration.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadExperiences = async () => {
    try {
      setIsExpLoading(true);
      const data = await fetchExperiences();
      const normalized =
        data?.map((exp) => ({
          id: exp.id,
          position: exp.position,
          company: exp.company,
          location: exp.location ?? "",
          website: exp.company_url ?? "",
          startDate: exp.start_date,
          endDate: exp.end_date,
          isPresent: exp.is_present,
          achievements: exp.achievements ?? [],
        })) || [];
      setExperiences(normalized);
    } catch (error) {
      console.error("Error loading experiences:", error);
      showNotification(
        error instanceof Error
          ? error.message
          : "Failed to load experiences. Check Supabase configuration.",
        "error",
      );
      setExperiences([]);
    } finally {
      setIsExpLoading(false);
    }
  };

  const loadCertificates = async () => {
    try {
      setIsCertLoading(true);
      const data = await fetchCertificates();
      const normalized =
        data?.map((cert) => ({
          id: cert.id,
          title: cert.title,
          issuer: cert.issuer,
          date: cert.date_issued,
          url: cert.certificate_url ?? "",
          description: (cert.description ?? []).join("\n"),
        })) || [];
      setCertifications(normalized);
    } catch (error) {
      console.error("Error loading certificates:", error);
      showNotification(
        error instanceof Error
          ? error.message
          : "Failed to load certificates. Check Supabase configuration.",
        "error",
      );
      setCertifications([]);
    } finally {
      setIsCertLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          const fileName = `${Date.now()}-${file.name}`;
          const result = await uploadProjectImage({
            data: { fileName, base64 },
          });
          resolve(result.url);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (formData: ProjectFormData) => {
    try {
      setIsSubmitting(true);

      const existingImages = formData.image_url ?? [];
      const newFiles = formData.image_files ?? [];
      const uploadedImageUrls = await Promise.all(
        newFiles.map((file) => handleImageUpload(file)),
      );

      const projectData: Omit<ProjectFormData, "image_files"> = {
        id: formData.id,
        title: formData.title,
        description: formData.description,
        github_url: formData.github_url,
        linkedin_url: formData.linkedin_url,
        skills: formData.skills,
        image_url: [...existingImages, ...uploadedImageUrls],
      };

      if (editingProject) {
        await updateProject({ data: projectData });
        showNotification("Project updated successfully", "success");
        setEditingProject(null);
      } else {
        await createProject({ data: projectData });
        showNotification("Project created successfully", "success");
      }

      await loadProjects();
      setIsFormOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      showNotification(errorMessage, "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (project: Project) => {
    if (!project || !project.id) {
      showNotification(
        "خطأ: لا يمكن تعديل هذا المشروع، المعرف مفقود.",
        "error",
      );
      // console.error("Missing project or ID:", project);
      return;
    }

    setEditingProject({ ...project });

    setIsFormOpen(true);

    console.log("Editing project ID:", project.id);
  };

  const handleDelete = async (projectId: string) => {
    if (!projectId) return;
    if (!confirm("Are you sure?")) return;

    try {
      setIsSubmitting(true);

      await deleteProject({ data: { id: projectId } });

      showNotification("Project deleted!", "success");
      await loadProjects();
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
  };

  const resetExperienceForm = () => {
    setExperienceForm({
      position: "",
      company: "",
      location: "",
      website: "",
      startDate: "",
      endDate: "",
      isPresent: false,
      achievements: [],
      achievementInput: "",
    });
    setEditingExperience(null);
  };

  const resetCertForm = () => {
    setCertForm({
      title: "",
      issuer: "",
      date: "",
      url: "",
      description: "",
    });
    setEditingCertificate(null);
  };

  const handleAddAchievement = () => {
    const next = experienceForm.achievementInput.trim();
    if (!next) return;
    if (!experienceForm.achievements.includes(next)) {
      setExperienceForm((prev) => ({
        ...prev,
        achievements: [...prev.achievements, next],
        achievementInput: "",
      }));
    } else {
      setExperienceForm((prev) => ({ ...prev, achievementInput: "" }));
    }
  };

  const handleRemoveAchievement = (item: string) => {
    setExperienceForm((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((ach) => ach !== item),
    }));
  };

  const handleAchievementKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAchievement();
    }
  };

  const handleEditExperience = (exp: ExperienceEntry) => {
    setEditingExperience(exp);
    setExperienceForm({
      position: exp.position,
      company: exp.company,
      location: exp.location,
      website: exp.website,
      startDate: exp.startDate,
      endDate: exp.endDate || "",
      isPresent: exp.isPresent,
      achievements: exp.achievements,
      achievementInput: "",
    });
    setIsExperienceFormOpen(true);
  };

  const handleExperienceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      id: editingExperience?.id,
      position: experienceForm.position.trim(),
      company: experienceForm.company.trim(),
      location: experienceForm.location.trim() || null,
      company_url: experienceForm.website.trim() || null,
      start_date: experienceForm.startDate.trim(),
      end_date: experienceForm.isPresent
        ? null
        : experienceForm.endDate.trim() || null,
      is_present: experienceForm.isPresent,
      achievements: experienceForm.achievements,
    };
    if (!payload.position || !payload.company || !payload.start_date) {
      showNotification(
        "Please fill position, company, and start date.",
        "error",
      );
      return;
    }
    setIsExpSubmitting(true);
    const action = editingExperience
      ? updateExperience({ data: payload })
      : createExperience({ data: payload });
    action
      .then(() => {
        showNotification(
          editingExperience ? "Experience updated" : "Experience added",
          "success",
        );
        resetExperienceForm();
        setIsExperienceFormOpen(false);
        loadExperiences();
      })
      .catch((error) => {
        console.error(error);
        showNotification(
          error instanceof Error ? error.message : "Failed to save experience",
          "error",
        );
      })
      .finally(() => setIsExpSubmitting(false));
  };

  const handleCertSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const descriptionItems = certForm.description
      .split(/\n|;/)
      .map((i) => i.trim())
      .filter(Boolean);
    const payload = {
      id: editingCertificate?.id,
      title: certForm.title.trim(),
      issuer: certForm.issuer.trim(),
      date_issued: certForm.date.trim(),
      certificate_url: certForm.url.trim() || null,
      description: descriptionItems,
    };
    if (!payload.title || !payload.issuer || !payload.date_issued) {
      showNotification("Please fill title, issuer, and date.", "error");
      return;
    }
    setIsCertSubmitting(true);
    const action = editingCertificate
      ? updateCertificate({ data: payload })
      : createCertificate({ data: payload });
    action
      .then(() => {
        showNotification(
          editingCertificate ? "Certificate updated" : "Certificate added",
          "success",
        );
        resetCertForm();
        setIsCertFormOpen(false);
        loadCertificates();
      })
      .catch((error) => {
        showNotification(
          error instanceof Error ? error.message : "Failed to save certificate",
          "error",
        );
      })
      .finally(() => setIsCertSubmitting(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Project Dashboard
            </h1>
            <p className="text-slate-400">Manage your portfolio projects</p>
          </div>
          <button
            onClick={() => {
              setEditingProject(null);
              setIsFormOpen(!isFormOpen);
            }}
            disabled={isSubmitting}
            className={cn(
              "mt-4 sm:mt-0 px-6 py-2 rounded-lg font-semibold transition-all duration-200",
              "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isFormOpen ? "Cancel" : "+ New Project"}
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px,1fr]">
          {/* Sidebar */}
          {/* <aside className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 h-max sticky top-8 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-3">
              Quick Nav
            </p>
            <nav className="space-y-2 text-sm text-slate-200">
              {[
                { href: "#projects", label: "Projects" },
                { href: "#experience", label: "Experience" },
                { href: "#certifications", label: "Certifications" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-700/60 transition-colors border border-transparent hover:border-slate-600"
                >
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  {link.label}
                </a>
              ))}
            </nav>
          </aside> */}

          {/* Main content */}
          <div className="space-y-10">
            <section id="projects" className="scroll-mt-24">
              {/* Notification Toast */}
              {notification && (
                <div
                  className={cn(
                    "mb-6 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top",
                    notification.type === "success"
                      ? "bg-emerald-900 border border-emerald-700 text-emerald-100"
                      : "bg-red-900 border border-red-700 text-red-100",
                  )}
                >
                  <span>{notification.message}</span>
                  <button
                    onClick={clearNotification}
                    className="text-xl font-bold hover:opacity-70 transition"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Form Section */}
              {isFormOpen && (
                <div className="mb-8 bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    {editingProject ? "Edit Project" : "Add New Project"}
                  </h2>
                  <ProjectForm
                    project={editingProject}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseForm}
                    isSubmitting={isSubmitting}
                  />
                </div>
              )}

              {/* Projects Grid */}
              <div>
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                      <p className="mt-4 text-slate-400">Loading projects...</p>
                    </div>
                  </div>
                ) : !projects || projects.length === 0 ? (
                  <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700">
                    <p className="text-slate-400 mb-4">
                      {!import.meta.env.VITE_SUPABASE_URL
                        ? "⚠️ Supabase not configured"
                        : "No projects yet"}
                    </p>
                    {!import.meta.env.VITE_SUPABASE_URL ? (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-400 mb-4">
                          To get started, create a{" "}
                          <code className="text-indigo-400">.env.local</code>{" "}
                          file in your project root:
                        </p>
                        <div className="bg-slate-900 p-4 rounded-lg text-left text-sm text-slate-300 overflow-auto">
                          <code>
                            VITE_SUPABASE_URL=https://your-project.supabase.co
                            <br />
                            VITE_SUPABASE_ANON_KEY=your-anon-key
                          </code>
                        </div>
                        <p className="text-xs text-slate-500">
                          See QUICKSTART.md for setup instructions →
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsFormOpen(true)}
                        className="text-indigo-400 hover:text-indigo-300 transition font-medium"
                      >
                        Create your first project →
                      </button>
                    )}
                  </div>
                ) : (
                  <ProjectGrid
                    projects={projects}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isSubmitting}
                  />
                )}
              </div>
            </section>

            {/* Experience Section */}
            <section id="experience" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Experience</h2>
                  <p className="text-slate-400 text-sm">
                    Add roles with timelines and achievements.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (isExperienceFormOpen) {
                      resetExperienceForm();
                      setIsExperienceFormOpen(false);
                    } else {
                      resetExperienceForm();
                      setIsExperienceFormOpen(true);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  {isExperienceFormOpen
                    ? "Close"
                    : editingExperience
                      ? "Edit Experience"
                      : "+ Add Experience"}
                </button>
              </div>

              {isExperienceFormOpen && (
                <div className="mb-6 bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
                  <form
                    onSubmit={handleExperienceSubmit}
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">Position</label>
                      <input
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        value={experienceForm.position}
                        onChange={(e) =>
                          setExperienceForm((p) => ({
                            ...p,
                            position: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">Company</label>
                      <input
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        value={experienceForm.company}
                        onChange={(e) =>
                          setExperienceForm((p) => ({
                            ...p,
                            company: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">Location</label>
                      <input
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        value={experienceForm.location}
                        onChange={(e) =>
                          setExperienceForm((p) => ({
                            ...p,
                            location: e.target.value,
                          }))
                        }
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">
                        Company Website
                      </label>
                      <input
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        value={experienceForm.website}
                        onChange={(e) =>
                          setExperienceForm((p) => ({
                            ...p,
                            website: e.target.value,
                          }))
                        }
                        placeholder="https://company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        value={experienceForm.startDate}
                        onChange={(e) =>
                          setExperienceForm((p) => ({
                            ...p,
                            startDate: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">End Date</label>
                      <input
                        type="date"
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-blue-500 outline-none disabled:opacity-60"
                        value={experienceForm.endDate}
                        disabled={experienceForm.isPresent}
                        onChange={(e) =>
                          setExperienceForm((p) => ({
                            ...p,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-3 md:col-span-2">
                      <input
                        id="isPresent"
                        type="checkbox"
                        checked={experienceForm.isPresent}
                        onChange={(e) =>
                          setExperienceForm((p) => ({
                            ...p,
                            isPresent: e.target.checked,
                            endDate: e.target.checked ? "" : p.endDate,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="isPresent"
                        className="text-sm text-slate-300"
                      >
                        I currently work here (sets end date to Present)
                      </label>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-sm text-slate-300">
                        Achievements
                      </label>
                      <div className="flex gap-2">
                        <input
                          className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                          value={experienceForm.achievementInput}
                          onChange={(e) =>
                            setExperienceForm((p) => ({
                              ...p,
                              achievementInput: e.target.value,
                            }))
                          }
                          onKeyDown={handleAchievementKeyDown}
                          placeholder="Add an achievement (e.g., Reduced churn by 12%)"
                        />
                        <button
                          type="button"
                          onClick={handleAddAchievement}
                          disabled={!experienceForm.achievementInput.trim()}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                      {experienceForm.achievements.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {experienceForm.achievements.map((ach) => (
                            <span
                              key={ach}
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-100"
                            >
                              {ach}
                              <button
                                type="button"
                                onClick={() => handleRemoveAchievement(ach)}
                                className="text-blue-300 hover:text-blue-100 transition"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          resetExperienceForm();
                          setIsExperienceFormOpen(false);
                        }}
                        className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isExpSubmitting}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isExpSubmitting ? "Saving..." : "Save Experience"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {isExpLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
                    <p className="mt-3 text-slate-400 text-sm">
                      Loading experiences...
                    </p>
                  </div>
                </div>
              ) : experiences.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-6 text-center text-slate-400">
                  No experiences yet. Add your first role.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {experiences.map((exp) => (
                    <div
                      key={exp.id || `${exp.company}-${exp.position}`}
                      className="rounded-xl border border-slate-700 bg-slate-800/70 p-5 shadow-lg flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-blue-200/80">
                            {exp.position}
                          </p>
                          <h3 className="text-lg font-semibold text-white">
                            {exp.company}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-300 bg-slate-900 border border-slate-700 rounded-full px-3 py-1">
                          {exp.startDate} -{" "}
                          {exp.isPresent ? "Present" : exp.endDate || "Present"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        {exp.location && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full">
                            <i className="fas fa-location-dot" />
                            {exp.location}
                          </span>
                        )}
                        {exp.website && (
                          <a
                            href={exp.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-blue-200 hover:border-blue-400"
                          >
                            <i className="fas fa-link" />
                            Website
                          </a>
                        )}
                      </div>
                      <ul className="space-y-2 text-sm text-slate-200">
                        {exp.achievements.map((ach) => (
                          <li key={ach} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                            <span className="leading-relaxed">{ach}</span>
                          </li>
                        ))}
                      </ul>
                      {exp.id && (
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => handleEditExperience(exp)}
                            className="text-xs text-blue-200 hover:text-blue-100 inline-flex items-center gap-1"
                          >
                            <i className="fas fa-pen" /> Edit
                          </button>
                          <button
                            onClick={() =>
                              deleteExperience({ data: { id: exp.id! } })
                                .then(() => {
                                  showNotification(
                                    "Experience deleted",
                                    "success",
                                  );
                                  loadExperiences();
                                })
                                .catch((error) =>
                                  showNotification(
                                    error instanceof Error
                                      ? error.message
                                      : "Failed to delete experience",
                                    "error",
                                  ),
                                )
                            }
                            className="text-xs text-red-300 hover:text-red-200 inline-flex items-center gap-1"
                          >
                            <i className="fas fa-trash" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Certifications Section */}
            <section id="certifications" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Certifications
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Track credentials with issuer, date, and proof URL.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (isCertFormOpen) {
                      resetCertForm();
                      setIsCertFormOpen(false);
                    } else {
                      resetCertForm();
                      setIsCertFormOpen(true);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                >
                  {isCertFormOpen
                    ? "Close"
                    : editingCertificate
                      ? "Edit Certificate"
                      : "+ Add Certificate"}
                </button>
              </div>

              {isCertFormOpen && (
                <div className="mb-6 bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
                  <form
                    onSubmit={handleCertSubmit}
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">
                        Certificate Title
                      </label>
                      <input
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-purple-500 outline-none disabled:opacity-50"
                        disabled={isCertSubmitting}
                        value={certForm.title}
                        onChange={(e) =>
                          setCertForm((p) => ({ ...p, title: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">Issuer</label>
                      <input
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-purple-500 outline-none disabled:opacity-50"
                        disabled={isCertSubmitting}
                        value={certForm.issuer}
                        onChange={(e) =>
                          setCertForm((p) => ({ ...p, issuer: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">Date</label>
                      <input
                        type="date"
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-purple-500 outline-none disabled:opacity-50"
                        disabled={isCertSubmitting}
                        value={certForm.date}
                        onChange={(e) =>
                          setCertForm((p) => ({ ...p, date: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">
                        Certificate URL
                      </label>
                      <input
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-white focus:border-purple-500 outline-none"
                        value={certForm.url}
                        onChange={(e) =>
                          setCertForm((p) => ({ ...p, url: e.target.value }))
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm text-slate-300">
                        Description
                      </label>
                      <textarea
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-white focus:border-purple-500 outline-none min-h-[100px] resize-vertical disabled:opacity-50"
                        disabled={isCertSubmitting}
                        value={certForm.description}
                        onChange={(e) =>
                          setCertForm((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        placeholder="One bullet per line (what you learned, tools used, assessments...)"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          resetCertForm();
                          setIsCertFormOpen(false);
                        }}
                        className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCertSubmitting}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {isCertSubmitting ? "Saving..." : "Save Certificate"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {isCertLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
                    <p className="mt-3 text-slate-400 text-sm">
                      Loading certificates...
                    </p>
                  </div>
                </div>
              ) : certifications.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-6 text-center text-slate-400">
                  No certificates yet. Add your first credential.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {certifications.map((cert) => (
                    <div
                      key={cert.id || cert.title}
                      className="rounded-xl border border-slate-700 bg-slate-800/70 p-5 shadow-lg flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-purple-200/80">
                            Certificate
                          </p>
                          <h3 className="text-lg font-semibold text-white">
                            {cert.title}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {cert.issuer}
                          </p>
                        </div>
                        <span className="text-xs text-slate-300 bg-slate-900 border border-slate-700 rounded-full px-3 py-1">
                          {cert.date}
                        </span>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-200 leading-relaxed">
                        {cert.description
                          .split(/\n/)
                          .filter(Boolean)
                          .map((line) => (
                            <li key={line} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-400" />
                              <span>{line}</span>
                            </li>
                          ))}
                      </ul>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        {cert.url && (
                          <a
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-purple-200 hover:border-purple-400"
                          >
                            <i className="fas fa-arrow-up-right-from-square" />
                            View certificate
                          </a>
                        )}
                      </div>
                      {cert.id && (
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => {
                              setEditingCertificate(cert);
                              setCertForm(cert);
                              setIsCertFormOpen(true);
                            }}
                            className="text-xs text-blue-200 hover:text-blue-100 inline-flex items-center gap-1"
                          >
                            <i className="fas fa-pen" /> Edit
                          </button>
                          <button
                            onClick={() =>
                              deleteCertificate({ data: { id: cert.id! } })
                                .then(() => {
                                  showNotification(
                                    "Certificate deleted",
                                    "success",
                                  );
                                  loadCertificates();
                                })
                                .catch((error) =>
                                  showNotification(
                                    error instanceof Error
                                      ? error.message
                                      : "Failed to delete certificate",
                                    "error",
                                  ),
                                )
                            }
                            className="text-xs text-red-300 hover:text-red-200 inline-flex items-center gap-1"
                          >
                            <i className="fas fa-trash" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
//         {/* Notification Toast */}
//         {notification && (
//           <div
//             className={cn(
//               "mb-6 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top",
//               notification.type === "success"
//                 ? "bg-emerald-900 border border-emerald-700 text-emerald-100"
//                 : "bg-red-900 border border-red-700 text-red-100",
//             )}
//           >
//             <span>{notification.message}</span>
//             <button
//               onClick={clearNotification}
//               className="text-xl font-bold hover:opacity-70 transition"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         {/* Form Section */}
//         {isFormOpen && (
//           <div className="mb-12 bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
//             <h2 className="text-2xl font-bold text-white mb-6">
//               {editingProject ? "Edit Project" : "Add New Project"}
//             </h2>
//             <ProjectForm
//               project={editingProject}
//               onSubmit={handleSubmit}
//               onCancel={handleCloseForm}
//               isSubmitting={isSubmitting}
//             />
//           </div>
//         )}

//         {/* Projects Grid */}
//         <div>
//           {isLoading ? (
//             <div className="flex items-center justify-center py-20">
//               <div className="text-center">
//                 <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
//                 <p className="mt-4 text-slate-400">Loading projects...</p>
//               </div>
//             </div>
//           ) : !projects || projects.length === 0 ? (
//             <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700">
//               <p className="text-slate-400 mb-4">
//                 {!import.meta.env.VITE_SUPABASE_URL
//                   ? "⚙️ Supabase not configured"
//                   : "No projects yet"}
//               </p>
//               {!import.meta.env.VITE_SUPABASE_URL ? (
//                 <div className="space-y-4">
//                   <p className="text-sm text-slate-400 mb-4">
//                     To get started, create a{" "}
//                     <code className="text-indigo-400">.env.local</code> file in
//                     your project root:
//                   </p>
//                   <div className="bg-slate-900 p-4 rounded-lg text-left text-sm text-slate-300 overflow-auto">
//                     <code>
//                       VITE_SUPABASE_URL=https://your-project.supabase.co
//                       <br />
//                       VITE_SUPABASE_ANON_KEY=your-anon-key
//                     </code>
//                   </div>
//                   <p className="text-xs text-slate-500">
//                     See QUICKSTART.md for setup instructions →
//                   </p>
//                 </div>
//               ) : (
//                 <button
//                   onClick={() => setIsFormOpen(true)}
//                   className="text-indigo-400 hover:text-indigo-300 transition font-medium"
//                 >
//                   Create your first project →
//                 </button>
//               )}
//             </div>
//           ) : (
//             <ProjectGrid
//               projects={projects}
//               onEdit={handleEdit}
//               onDelete={handleDelete}
//               isDeleting={isSubmitting}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
