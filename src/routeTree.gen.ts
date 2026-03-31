/* eslint-disable */
// @ts-nocheck
// Generated route tree for TanStack Router (SPA)

import { Route as rootRouteImport } from "./routes/__root";
import { Route as ResumeRouteImport } from "./routes/resume";
import { Route as DashboardRouteImport } from "./routes/dashboard";
import { Route as ContactRouteImport } from "./routes/contact";
import { Route as CertificatesRouteImport } from "./routes/certificates";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as BlogSlugRouteImport } from "./routes/blog/$slug";
import { Route as ProjectsRouteImport } from "./routes/projects/projects";
import { Route as ProjectsSlugRouteImport } from "./routes/projects/$slug";

const ResumeRoute = ResumeRouteImport.update({
  id: "/resume",
  path: "/resume",
  getParentRoute: () => rootRouteImport,
} as any);

const DashboardRoute = DashboardRouteImport.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => rootRouteImport,
} as any);

const ContactRoute = ContactRouteImport.update({
  id: "/contact",
  path: "/contact",
  getParentRoute: () => rootRouteImport,
} as any);

const CertificatesRoute = CertificatesRouteImport.update({
  id: "/certificates",
  path: "/certificates",
  getParentRoute: () => rootRouteImport,
} as any);

const IndexRoute = IndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => rootRouteImport,
} as any);

const ProjectsRoute = ProjectsRouteImport.update({
  id: "/projects",
  path: "/projects",
  getParentRoute: () => rootRouteImport,
} as any);

const ProjectsSlugRoute = ProjectsSlugRouteImport.update({
  id: "/projects/$slug",
  path: "/$slug",
  getParentRoute: () => ProjectsRoute,
} as any);

const BlogSlugRoute = BlogSlugRouteImport.update({
  id: "/blog/$slug",
  path: "/blog/$slug",
  getParentRoute: () => rootRouteImport,
} as any);

export interface FileRoutesByFullPath {
  "/": typeof IndexRoute;
  "/contact": typeof ContactRoute;
  "/certificates": typeof CertificatesRoute;
  "/dashboard": typeof DashboardRoute;
  "/resume": typeof ResumeRoute;
  "/projects": typeof ProjectsRouteWithChildren;
  "/projects/$slug": typeof ProjectsSlugRoute;
  "/blog/$slug": typeof BlogSlugRoute;
}
export interface FileRoutesByTo {
  "/": typeof IndexRoute;
  "/contact": typeof ContactRoute;
  "/certificates": typeof CertificatesRoute;
  "/dashboard": typeof DashboardRoute;
  "/resume": typeof ResumeRoute;
  "/projects": typeof ProjectsRouteWithChildren;
  "/projects/$slug": typeof ProjectsSlugRoute;
  "/blog/$slug": typeof BlogSlugRoute;
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport;
  "/": typeof IndexRoute;
  "/contact": typeof ContactRoute;
  "/certificates": typeof CertificatesRoute;
  "/dashboard": typeof DashboardRoute;
  "/resume": typeof ResumeRoute;
  "/projects": typeof ProjectsRouteWithChildren;
  "/projects/$slug": typeof ProjectsSlugRoute;
  "/blog/$slug": typeof BlogSlugRoute;
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths:
    | "/"
    | "/contact"
    | "/certificates"
    | "/dashboard"
    | "/resume"
    | "/projects"
    | "/projects/$slug"
    | "/blog/$slug";
  fileRoutesByTo: FileRoutesByTo;
  to:
    | "/"
    | "/contact"
    | "/certificates"
    | "/dashboard"
    | "/resume"
    | "/projects"
    | "/projects/$slug"
    | "/blog/$slug";
  id:
    | "__root__"
    | "/"
    | "/contact"
    | "/certificates"
    | "/dashboard"
    | "/resume"
    | "/projects"
    | "/projects/$slug"
    | "/blog/$slug";
  fileRoutesById: FileRoutesById;
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute;
  ContactRoute: typeof ContactRoute;
  CertificatesRoute: typeof CertificatesRoute;
  DashboardRoute: typeof DashboardRoute;
  ResumeRoute: typeof ResumeRoute;
  ProjectsRoute: typeof ProjectsRouteWithChildren;
  BlogSlugRoute: typeof BlogSlugRoute;
}

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/resume": {
      id: "/resume";
      path: "/resume";
      fullPath: "/resume";
      preLoaderRoute: typeof ResumeRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/dashboard": {
      id: "/dashboard";
      path: "/dashboard";
      fullPath: "/dashboard";
      preLoaderRoute: typeof DashboardRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/contact": {
      id: "/contact";
      path: "/contact";
      fullPath: "/contact";
      preLoaderRoute: typeof ContactRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/certificates": {
      id: "/certificates";
      path: "/certificates";
      fullPath: "/certificates";
      preLoaderRoute: typeof CertificatesRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/": {
      id: "/";
      path: "/";
      fullPath: "/";
      preLoaderRoute: typeof IndexRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/projects": {
      id: "/projects";
      path: "/projects";
      fullPath: "/projects";
      preLoaderRoute: typeof ProjectsRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/projects/$slug": {
      id: "/projects/$slug";
      path: "/$slug";
      fullPath: "/projects/$slug";
      preLoaderRoute: typeof ProjectsSlugRouteImport;
      parentRoute: typeof ProjectsRoute;
    };
    "/blog/$slug": {
      id: "/blog/$slug";
      path: "/blog/$slug";
      fullPath: "/blog/$slug";
      preLoaderRoute: typeof BlogSlugRouteImport;
      parentRoute: typeof rootRouteImport;
    };
  }
}

interface ProjectsRouteChildren {
  ProjectsSlugRoute: typeof ProjectsSlugRoute;
}

const ProjectsRouteChildren: ProjectsRouteChildren = {
  ProjectsSlugRoute: ProjectsSlugRoute,
};

const ProjectsRouteWithChildren = ProjectsRoute._addFileChildren(
  ProjectsRouteChildren,
);

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  ContactRoute: ContactRoute,
  CertificatesRoute: CertificatesRoute,
  DashboardRoute: DashboardRoute,
  ResumeRoute: ResumeRoute,
  ProjectsRoute: ProjectsRouteWithChildren,
  BlogSlugRoute: BlogSlugRoute,
};

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>();
