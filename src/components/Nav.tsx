"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { API_BASE } from "@/lib/env";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { href: "/", label: "Gallery", hash: "#gallery" as const },
  { href: "/showcase", label: "Showcase" },
  { href: "/developer", label: "Developer" },
] as const;

export default function Nav() {
  const pathname = useLocation().pathname;
  const { isAuthenticated, isVerified, member, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wasMenuOpen = useRef(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (wasMenuOpen.current && !menuOpen) {
      menuButtonRef.current?.focus();
    }
    wasMenuOpen.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    if (!panel) {
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }

    const focusTargets = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusTargets[0];
    const last = focusTargets[focusTargets.length - 1];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || focusTargets.length === 0) return;

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen, closeMenu]);

  const isActive = (href: string) =>
    pathname === href || (href === "/showcase" && pathname.startsWith("/showcase"));

  const linkClass = (href: string, mobile = false) => {
    const active = isActive(href);
    const base = mobile
      ? "block rounded-md px-3 py-2.5 text-base transition-colors"
      : "text-sm transition-colors";
    return `${base} ${active ? "text-ink font-medium" : "text-ink-2 hover:text-ink"}`;
  };

  const apiDocsClass = (mobile = false) =>
    mobile
      ? "block rounded-md px-3 py-2.5 text-base text-ink-2 hover:text-ink transition-colors"
      : "text-sm text-ink-2 hover:text-ink transition-colors whitespace-nowrap shrink-0";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto min-w-0 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 group min-w-0 shrink">
          <span className="relative w-5 h-5 flex items-center justify-center shrink-0">
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
            className="text-base font-medium tracking-tight text-ink truncate [font-family:var(--f-display)]"
            style={{ letterSpacing: "-0.012em" }}
          >
            mesocosm
          </span>
        </Link>

        <nav
          className="hidden md:flex items-center gap-6 min-w-0"
          aria-label="Main"
        >
          {NAV_LINKS.map(({ href, label, ...rest }) => (
            <Link
              key={href}
              to={"hash" in rest ? { pathname: href, hash: rest.hash } : href}
              className={linkClass(href)}
            >
              {label}
            </Link>
          ))}
          <a
            href={`${API_BASE}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className={apiDocsClass()}
          >
            API Docs
          </a>
          {!loading && isAuthenticated && isVerified && member ? (
            <Link to="/account" className={linkClass("/account")}>
              {member.username}
            </Link>
          ) : null}
          {!loading && !isAuthenticated ? (
            <Link to="/auth" className={linkClass("/auth")}>
              Sign in
            </Link>
          ) : null}
          <ThemeToggle />
        </nav>

        <div className="flex md:hidden items-center gap-2 shrink-0">
          <ThemeToggle />
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-line text-ink-2 hover:border-ink hover:text-ink transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              {menuOpen ? (
                <path
                  d="M4 4 L12 12 M12 4 L4 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <path d="M2 4 H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M2 8 H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M2 12 H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-ink/20 md:hidden cursor-default"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={closeMenu}
          />
          <nav
            ref={panelRef}
            id="mobile-nav-menu"
            aria-label="Main"
            className="fixed left-0 right-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overflow-x-hidden border-b border-line bg-paper shadow-sm md:hidden"
          >
            <div className="max-w-7xl mx-auto min-w-0 px-4 sm:px-6 py-3 flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label, ...rest }) => (
                <Link
                  key={href}
                  to={"hash" in rest ? { pathname: href, hash: rest.hash } : href}
                  className={linkClass(href, true)}
                  onClick={closeMenu}
                >
                  {label}
                </Link>
              ))}
              <a
                href={`${API_BASE}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className={apiDocsClass(true)}
                onClick={closeMenu}
              >
                API Docs
              </a>
              {!loading && isAuthenticated && isVerified && member ? (
                <Link
                  to="/account"
                  className={linkClass("/account", true)}
                  onClick={closeMenu}
                >
                  {member.username}
                </Link>
              ) : null}
              {!loading && !isAuthenticated ? (
                <Link
                  to="/auth"
                  className={linkClass("/auth", true)}
                  onClick={closeMenu}
                >
                  Sign in
                </Link>
              ) : null}
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
