import { useEffect } from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Not found — Mesocosm";
  }, []);

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-3xl font-medium text-ink [font-family:var(--f-display)]">Nothing here.</h1>
      <p className="mt-3 text-ink-2 text-sm leading-relaxed">
        That exhibit may have been archived, or the link is mistyped.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex text-sm font-medium text-ink hover:text-leaf-deep transition-colors underline underline-offset-2"
      >
        ← Back to the gallery
      </Link>
    </div>
  );
}
