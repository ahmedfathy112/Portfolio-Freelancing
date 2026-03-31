import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { fetchCertificates } from "@/server/certificates.functions";

export const Route = createFileRoute("/certificates")({
  loader: async () => {
    try {
      const certificates = await fetchCertificates();
      return { certificates, certificatesError: null };
    } catch (error) {
      return { 
        certificates: [],
        certificatesError:
          error instanceof Error
            ? error.message
            : "Failed to load certificates",
      };
    }
  },
  component: CertificatesPage,
});

function CertificatesPage() {
  const { certificates, certificatesError } = Route.useLoaderData();

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] px-4 py-24 text-gray-100">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="mb-12 max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Certificates
          </p>
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
            A complete view of my certifications
          </h1>
          <p className="text-lg leading-8 text-slate-300">
            Browse the full set of credentials, including issuing organization,
            issue date, proof links, and the highlights behind each certificate.
          </p>
        </div>

        {certificatesError && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {certificatesError}
          </div>
        )}

        {certificates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {certificates.map((cert) => (
              <article
                key={cert.id}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500" />
                <div className="flex h-full flex-col gap-4 pl-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-blue-200/80">
                        Certificate
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-white">
                        {cert.title}
                      </h2>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                      <i className="fas fa-calendar" />
                      <span>{formatDate(cert.date_issued)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-blue-100">
                      <i className="fas fa-building-columns" />
                      {cert.issuer}
                    </div>
                    {cert.certificate_url && (
                      <a
                        href={cert.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-gray-200 transition-colors hover:border-blue-400 hover:text-blue-200"
                      >
                        <i className="fas fa-arrow-up-right-from-square" />
                        View certificate
                      </a>
                    )}
                  </div>

                  <ul className="space-y-2 text-sm leading-relaxed text-gray-300">
                    {cert.description.map((line, index) => (
                      <li key={`${cert.id}-${index}`} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-400" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-16 text-center">
            <p className="text-xl font-semibold text-white">
              No certificates found
            </p>
            <p className="mt-3 text-slate-400">
              Add certificates in the dashboard and they will appear here.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
