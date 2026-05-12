import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { Layout } from "./Layout";
import { HomePage } from "./pages/HomePage";
import { DeveloperPage } from "./pages/DeveloperPage";
import { DomainDetailPage } from "./pages/DomainDetailPage";
import { ShowcasePage } from "./pages/ShowcasePage";
import { ShowcaseConnectionsPage } from "./pages/ShowcaseConnectionsPage";
import { ShowcaseTradingPage } from "./pages/ShowcaseTradingPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/** Vite `BASE_URL` ends with `/`; React Router `basename` must not. */
function routerBasename(): string | undefined {
  const b = import.meta.env.BASE_URL.replace(/\/+$/, "");
  return b || undefined;
}

/**
 * GitHub project Pages (`…/github.io/repo/`) is a static host: path-based
 * `BrowserRouter` is fragile (trailing slash, 404 HTML, etc.). Hash history
 * avoids the server seeing client routes at all.
 */
function useHashRouter(): boolean {
  return import.meta.env.PROD && Boolean(routerBasename());
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="developer" element={<DeveloperPage />} />
        <Route path="domains/:id" element={<DomainDetailPage />} />
        <Route path="showcase" element={<ShowcasePage />} />
        <Route path="showcase/connections" element={<ShowcaseConnectionsPage />} />
        <Route path="showcase/trading" element={<ShowcaseTradingPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  // Hash history pathname is parsed from the hash only (`#/…` → `/…`), not from
  // `window.location.pathname`, so a GitHub Pages repo basename must NOT be set
  // here — otherwise stripBasename never matches and no routes render.
  if (useHashRouter()) {
    return (
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    );
  }
  return (
    <BrowserRouter basename={routerBasename()}>
      <AppRoutes />
    </BrowserRouter>
  );
}
