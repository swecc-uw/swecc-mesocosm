"use client";

import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ds/ThemeToggle";

export default function Nav() {
  const pathname = useLocation().pathname;

  const link = (href: string, label: string) => {
    const active =
      pathname === href || (href === "/showcase" && pathname.startsWith("/showcase"));
    return (
      <Link
        key={href}
        to={href}
        className={`text-sm transition-colors ${
          active ? "text-ink font-medium" : "text-ink-2 hover:text-ink"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="relative w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path
                d="M3 13 C 3 7, 7 3, 13 3 C 13 9, 9 13, 3 13 Z"
                fill="var(--leaf)"
                stroke="var(--leaf-deep)"
                strokeWidth="0.5"
              />
              <path d="M3 13 L 13 3" stroke="var(--leaf-deep)" strokeWidth="0.6" strokeLinecap="round" />
              <path d="M3 13 L 1.5 14.5" stroke="var(--leaf-deep)" strokeWidth="0.6" strokeLinecap="round" />
            </svg>
          </span>
          <span
            className="text-base font-medium tracking-tight text-ink [font-family:var(--f-display)]"
            style={{ letterSpacing: "-0.012em" }}
          >
            mesocosm
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {link("/", "Gallery")}
          {link("/showcase", "Showcase")}
          {link("/developer", "Developer")}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-2 hover:text-ink transition-colors"
          >
            API Docs
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
