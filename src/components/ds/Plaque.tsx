import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

// The shared plaque shell. Hairline border, square (2px) radius,
// vellum plate at top, body below. Used by PracticalPlaque and any
// future showcase plaque variants.
export function Plaque({ children, className = "" }: Props) {
  return (
    <article
      className={`bg-paper border border-line rounded-[2px] flex flex-col overflow-hidden ${className}`}
    >
      {children}
    </article>
  );
}

export function PlaquePlate({ children, className = "" }: Props) {
  return (
    <div
      className={`bg-vellum border-b border-line flex items-center justify-center px-5 py-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function PlaqueBody({ children, className = "" }: Props) {
  return (
    <div className={`px-5 py-4 flex flex-col gap-3 ${className}`}>{children}</div>
  );
}

interface MetricStripProps {
  items: { label: string; value: ReactNode }[];
  className?: string;
}

export function PlaqueMetricStrip({ items, className = "" }: MetricStripProps) {
  return (
    <div
      className={`grid border-t border-line ${className}`}
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className={`px-3 py-3 ${i < items.length - 1 ? "border-r border-line" : ""}`}
        >
          <div className="num-old text-2xl text-ink leading-none">{it.value}</div>
          <div className="eyebrow mt-1.5">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
