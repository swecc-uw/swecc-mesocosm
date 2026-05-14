import { Outlet } from "react-router-dom";
import Nav from "@/components/Nav";
import { API_BASE } from "@/lib/env";
import "./globals.css";

export function Layout() {
  return (
    <div className="min-h-full flex flex-col bg-paper text-ink font-body">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-line py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted">
          <span>Mesocosm · a distributed AI evaluation protocol</span>
          <a
            href={`${API_BASE}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition-colors"
          >
            API Docs
          </a>
        </div>
      </footer>
    </div>
  );
}
