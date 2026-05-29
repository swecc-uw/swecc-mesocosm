import { useState } from "react";

const LONG_CHAR_THRESHOLD = 280;
const LONG_LINE_THRESHOLD = 3;

function isLongError(text: string): boolean {
  return (
    text.length > LONG_CHAR_THRESHOLD ||
    text.split("\n").length > LONG_LINE_THRESHOLD
  );
}

interface Props {
  text: string;
  className?: string;
}

export default function ExpandableErrorText({ text, className = "" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const long = isLongError(text);

  const preBase =
    "p-2 border border-line rounded-[2px] bg-paper-2 text-bad whitespace-pre-wrap break-all leading-relaxed num-tab";
  const preSize = className.includes("text-xs") ? "text-xs" : "text-[10px]";

  return (
    <div className={className}>
      <pre
        className={`${preBase} ${preSize} ${
          expanded
            ? "max-h-[min(70vh,32rem)] overflow-y-auto overflow-x-auto"
            : long
              ? "max-h-[4.5rem] overflow-hidden"
              : ""
        }`}
        style={{ fontFamily: "var(--f-mono)" }}
      >
        {text}
      </pre>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1.5 text-[10px] text-ink-3 uppercase tracking-[0.14em] hover:text-ink-2 transition-colors"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
