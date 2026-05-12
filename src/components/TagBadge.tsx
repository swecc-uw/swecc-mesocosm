interface TagBadgeProps {
  tag: string;
  active?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export default function TagBadge({ tag, active, onClick, size = "sm" }: TagBadgeProps) {
  const height = size === "sm" ? "h-5" : "h-6";
  const px = size === "sm" ? "px-2" : "px-2.5";

  const styles = active
    ? `bg-ink text-paper dark:bg-leaf-deep`
    : onClick
      ? `border border-line text-ink-2 hover:border-ink hover:text-ink cursor-pointer transition-colors`
      : `border border-line text-ink-3`;

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center ${px} ${height} rounded-full text-[10px] uppercase tracking-[0.16em] font-medium ${styles}`}
    >
      {tag}
    </span>
  );
}
