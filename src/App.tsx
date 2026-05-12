import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { HomePage } from "./pages/HomePage";
import { DeveloperPage } from "./pages/DeveloperPage";
import { DomainDetailPage } from "./pages/DomainDetailPage";
import { ShowcasePage } from "./pages/ShowcasePage";
import { ShowcaseConnectionsPage } from "./pages/ShowcaseConnectionsPage";
import { ShowcaseTradingPage } from "./pages/ShowcaseTradingPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
